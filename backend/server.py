from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'trading_app_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ALPHA_VANTAGE_KEY = os.environ.get('ALPHA_VANTAGE_KEY', 'demo')

# Create the main app
app = FastAPI(title="Trading Learning App")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str
    portfolio_value: float = 100000.0
    completed_lessons: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    high: float
    low: float
    open: float
    previous_close: float
    timestamp: str

class TradeRequest(BaseModel):
    symbol: str
    action: str  # "buy" or "sell"
    quantity: int
    price: float

class PortfolioPosition(BaseModel):
    symbol: str
    quantity: int
    avg_price: float
    current_price: float
    total_value: float
    profit_loss: float
    profit_loss_percent: float

class Portfolio(BaseModel):
    cash: float
    positions: List[PortfolioPosition]
    total_value: float
    total_profit_loss: float

class ChatMessage(BaseModel):
    message: str

class LessonProgress(BaseModel):
    lesson_id: str
    completed: bool = True

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "portfolio_value": 100000.0,
        "completed_lessons": [],
        "cash": 100000.0,
        "positions": []
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"],
            portfolio_value=100000.0,
            completed_lessons=[]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
            portfolio_value=user.get("portfolio_value", 100000.0),
            completed_lessons=user.get("completed_lessons", [])
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"],
        portfolio_value=current_user.get("portfolio_value", 100000.0),
        completed_lessons=current_user.get("completed_lessons", [])
    )

# ============== STOCK DATA ROUTES ==============

@api_router.get("/stocks/{symbol}/quote", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.alphavantage.co/query",
                params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol.upper(),
                    "apikey": ALPHA_VANTAGE_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            if "Global Quote" not in data or not data["Global Quote"]:
                raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
            
            quote = data["Global Quote"]
            return StockQuote(
                symbol=quote.get("01. symbol", symbol.upper()),
                price=float(quote.get("05. price", 0)),
                change=float(quote.get("09. change", 0)),
                change_percent=float(quote.get("10. change percent", "0").replace("%", "")),
                volume=int(quote.get("06. volume", 0)),
                high=float(quote.get("03. high", 0)),
                low=float(quote.get("04. low", 0)),
                open=float(quote.get("02. open", 0)),
                previous_close=float(quote.get("08. previous close", 0)),
                timestamp=quote.get("07. latest trading day", datetime.now(timezone.utc).isoformat())
            )
    except httpx.RequestError as e:
        logger.error(f"Alpha Vantage API error: {e}")
        raise HTTPException(status_code=503, detail="Stock data service unavailable")

@api_router.get("/stocks/{symbol}/chart")
async def get_stock_chart(symbol: str, interval: str = "daily"):
    try:
        function_map = {
            "daily": "TIME_SERIES_DAILY",
            "weekly": "TIME_SERIES_WEEKLY",
            "monthly": "TIME_SERIES_MONTHLY"
        }
        function = function_map.get(interval, "TIME_SERIES_DAILY")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.alphavantage.co/query",
                params={
                    "function": function,
                    "symbol": symbol.upper(),
                    "apikey": ALPHA_VANTAGE_KEY,
                    "outputsize": "compact"
                },
                timeout=15.0
            )
            data = response.json()
            
            time_series_key = None
            for key in data.keys():
                if "Time Series" in key:
                    time_series_key = key
                    break
            
            if not time_series_key or time_series_key not in data:
                raise HTTPException(status_code=404, detail=f"Chart data for {symbol} not found")
            
            chart_data = []
            for date, values in list(data[time_series_key].items())[:100]:
                chart_data.append({
                    "date": date,
                    "open": float(values["1. open"]),
                    "high": float(values["2. high"]),
                    "low": float(values["3. low"]),
                    "close": float(values["4. close"]),
                    "volume": int(values["5. volume"])
                })
            
            return {"symbol": symbol.upper(), "interval": interval, "data": list(reversed(chart_data))}
    except httpx.RequestError as e:
        logger.error(f"Alpha Vantage chart API error: {e}")
        raise HTTPException(status_code=503, detail="Chart data service unavailable")

@api_router.get("/stocks/search")
async def search_stocks(query: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.alphavantage.co/query",
                params={
                    "function": "SYMBOL_SEARCH",
                    "keywords": query,
                    "apikey": ALPHA_VANTAGE_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            matches = data.get("bestMatches", [])
            return [{
                "symbol": m.get("1. symbol"),
                "name": m.get("2. name"),
                "type": m.get("3. type"),
                "region": m.get("4. region")
            } for m in matches[:10]]
    except httpx.RequestError as e:
        logger.error(f"Alpha Vantage search error: {e}")
        raise HTTPException(status_code=503, detail="Search service unavailable")

# ============== TECHNICAL INDICATORS ==============

@api_router.get("/stocks/{symbol}/indicators")
async def get_indicators(symbol: str, indicator: str = "RSI"):
    try:
        indicator_map = {
            "RSI": ("RSI", "Technical Analysis: RSI"),
            "MACD": ("MACD", "Technical Analysis: MACD"),
            "SMA": ("SMA", "Technical Analysis: SMA"),
            "EMA": ("EMA", "Technical Analysis: EMA")
        }
        
        if indicator.upper() not in indicator_map:
            raise HTTPException(status_code=400, detail=f"Unsupported indicator: {indicator}")
        
        func, key = indicator_map[indicator.upper()]
        
        params = {
            "function": func,
            "symbol": symbol.upper(),
            "apikey": ALPHA_VANTAGE_KEY,
            "interval": "daily",
            "time_period": 14,
            "series_type": "close"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.alphavantage.co/query",
                params=params,
                timeout=15.0
            )
            data = response.json()
            
            indicator_data = []
            for k, v in data.items():
                if "Technical Analysis" in k:
                    for date, values in list(v.items())[:50]:
                        indicator_data.append({"date": date, **{ik: float(iv) for ik, iv in values.items()}})
                    break
            
            return {"symbol": symbol.upper(), "indicator": indicator.upper(), "data": list(reversed(indicator_data))}
    except httpx.RequestError as e:
        logger.error(f"Indicator API error: {e}")
        raise HTTPException(status_code=503, detail="Indicator service unavailable")

# ============== PAPER TRADING ==============

@api_router.get("/portfolio", response_model=Portfolio)
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    positions = current_user.get("positions", [])
    cash = current_user.get("cash", 100000.0)
    
    portfolio_positions = []
    total_value = cash
    total_profit_loss = 0
    
    for pos in positions:
        current_price = pos.get("current_price", pos["avg_price"])
        total_pos_value = current_price * pos["quantity"]
        pl = (current_price - pos["avg_price"]) * pos["quantity"]
        pl_percent = ((current_price - pos["avg_price"]) / pos["avg_price"]) * 100 if pos["avg_price"] > 0 else 0
        
        portfolio_positions.append(PortfolioPosition(
            symbol=pos["symbol"],
            quantity=pos["quantity"],
            avg_price=pos["avg_price"],
            current_price=current_price,
            total_value=total_pos_value,
            profit_loss=pl,
            profit_loss_percent=pl_percent
        ))
        total_value += total_pos_value
        total_profit_loss += pl
    
    return Portfolio(
        cash=cash,
        positions=portfolio_positions,
        total_value=total_value,
        total_profit_loss=total_profit_loss
    )

@api_router.post("/portfolio/trade")
async def execute_trade(trade: TradeRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    cash = current_user.get("cash", 100000.0)
    positions = current_user.get("positions", [])
    
    total_cost = trade.price * trade.quantity
    
    if trade.action == "buy":
        if total_cost > cash:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        existing_pos = next((p for p in positions if p["symbol"] == trade.symbol), None)
        if existing_pos:
            new_qty = existing_pos["quantity"] + trade.quantity
            new_avg = ((existing_pos["avg_price"] * existing_pos["quantity"]) + total_cost) / new_qty
            existing_pos["quantity"] = new_qty
            existing_pos["avg_price"] = new_avg
            existing_pos["current_price"] = trade.price
        else:
            positions.append({
                "symbol": trade.symbol,
                "quantity": trade.quantity,
                "avg_price": trade.price,
                "current_price": trade.price
            })
        
        cash -= total_cost
        
    elif trade.action == "sell":
        existing_pos = next((p for p in positions if p["symbol"] == trade.symbol), None)
        if not existing_pos or existing_pos["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        existing_pos["quantity"] -= trade.quantity
        if existing_pos["quantity"] == 0:
            positions = [p for p in positions if p["symbol"] != trade.symbol]
        
        cash += total_cost
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'buy' or 'sell'")
    
    # Update portfolio value
    total_value = cash + sum(p["quantity"] * p.get("current_price", p["avg_price"]) for p in positions)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"cash": cash, "positions": positions, "portfolio_value": total_value}}
    )
    
    # Record trade history
    await db.trades.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "symbol": trade.symbol,
        "action": trade.action,
        "quantity": trade.quantity,
        "price": trade.price,
        "total": total_cost,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Successfully {trade.action} {trade.quantity} shares of {trade.symbol}", "cash": cash}

@api_router.get("/portfolio/history")
async def get_trade_history(current_user: dict = Depends(get_current_user)):
    trades = await db.trades.find({"user_id": current_user["id"]}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return trades

# ============== LEARNING MODULES ==============

LESSONS = [
    {"id": "basics-1", "module": "basics", "title": "What is the Stock Market?", "duration": 5,
     "content": "The stock market is a collection of markets where stocks (shares of ownership in businesses) are bought and sold. It provides companies with access to capital and investors with potential returns."},
    {"id": "basics-2", "module": "basics", "title": "Understanding Stock Prices", "duration": 7,
     "content": "Stock prices are determined by supply and demand. When more people want to buy a stock than sell it, the price goes up. Key terms: Bid (buy price), Ask (sell price), Spread (difference)."},
    {"id": "basics-3", "module": "basics", "title": "Types of Orders", "duration": 6,
     "content": "Market Order: Buy/sell immediately at current price. Limit Order: Buy/sell at a specific price or better. Stop Order: Becomes market order when price reaches trigger."},
    {"id": "basics-4", "module": "basics", "title": "Reading Stock Quotes", "duration": 8,
     "content": "A stock quote shows: Symbol, Price, Change, Volume, High/Low, Open/Close. Understanding these helps you make informed decisions."},
    {"id": "technical-1", "module": "technical", "title": "Introduction to Technical Analysis", "duration": 10,
     "content": "Technical analysis uses historical price and volume data to predict future movements. It assumes all information is reflected in the price."},
    {"id": "technical-2", "module": "technical", "title": "Moving Averages (SMA & EMA)", "duration": 12,
     "content": "SMA: Simple average of prices over a period. EMA: Weighted average giving more importance to recent prices. Used to identify trends."},
    {"id": "technical-3", "module": "technical", "title": "RSI - Relative Strength Index", "duration": 10,
     "content": "RSI measures momentum on a scale of 0-100. Above 70 = overbought (potential sell). Below 30 = oversold (potential buy)."},
    {"id": "technical-4", "module": "technical", "title": "MACD Indicator", "duration": 12,
     "content": "MACD shows relationship between two moving averages. Signal line crossovers indicate buy/sell opportunities. Histogram shows momentum strength."},
    {"id": "risk-1", "module": "risk", "title": "Risk Management Basics", "duration": 8,
     "content": "Never risk more than 1-2% of your portfolio on a single trade. Use stop-losses to limit downside. Diversify across sectors."},
    {"id": "risk-2", "module": "risk", "title": "Position Sizing", "duration": 10,
     "content": "Calculate position size based on risk tolerance. Formula: Position Size = (Account Risk) / (Trade Risk per Share)."},
]

@api_router.get("/learn/modules")
async def get_modules():
    modules = {
        "basics": {"id": "basics", "title": "Market Basics", "description": "Learn the fundamentals of stock trading", "lessons": []},
        "technical": {"id": "technical", "title": "Technical Analysis", "description": "Master chart patterns and indicators", "lessons": []},
        "risk": {"id": "risk", "title": "Risk Management", "description": "Protect your capital with smart strategies", "lessons": []}
    }
    for lesson in LESSONS:
        modules[lesson["module"]]["lessons"].append({
            "id": lesson["id"],
            "title": lesson["title"],
            "duration": lesson["duration"]
        })
    return list(modules.values())

@api_router.get("/learn/lesson/{lesson_id}")
async def get_lesson(lesson_id: str):
    lesson = next((l for l in LESSONS if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@api_router.post("/learn/progress")
async def update_progress(progress: LessonProgress, current_user: dict = Depends(get_current_user)):
    completed = current_user.get("completed_lessons", [])
    if progress.completed and progress.lesson_id not in completed:
        completed.append(progress.lesson_id)
    elif not progress.completed and progress.lesson_id in completed:
        completed.remove(progress.lesson_id)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"completed_lessons": completed}}
    )
    return {"completed_lessons": completed}

@api_router.get("/learn/progress")
async def get_progress(current_user: dict = Depends(get_current_user)):
    completed = current_user.get("completed_lessons", [])
    total = len(LESSONS)
    return {
        "completed_lessons": completed,
        "total_lessons": total,
        "progress_percent": (len(completed) / total) * 100 if total > 0 else 0
    }

# ============== AI ADVISOR ==============

@api_router.post("/advisor/chat")
async def chat_with_advisor(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"trading-advisor-{current_user['id']}",
            system_message="""You are an expert trading advisor and educator. Your role is to:
1. Explain trading concepts in simple terms
2. Provide educational insights about technical analysis
3. Offer general market guidance (not specific financial advice)
4. Help users understand risk management
5. Answer questions about trading strategies

Important: Always remind users that this is educational content and not financial advice. They should do their own research before making trading decisions."""
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)
        
        # Store chat history
        await db.chat_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "user_message": message.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"response": response}
    except Exception as e:
        logger.error(f"AI Advisor error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")

@api_router.get("/advisor/tips")
async def get_trading_tips(current_user: dict = Depends(get_current_user)):
    tips = [
        {"id": "1", "category": "Risk", "tip": "Never invest more than you can afford to lose. Start with paper trading to practice."},
        {"id": "2", "category": "Technical", "tip": "Always confirm signals with multiple indicators. RSI + MACD together are more reliable than either alone."},
        {"id": "3", "category": "Psychology", "tip": "Emotions are your enemy in trading. Stick to your plan and avoid revenge trading."},
        {"id": "4", "category": "Strategy", "tip": "Define your exit strategy before entering a trade. Know your stop-loss and take-profit levels."},
        {"id": "5", "category": "Learning", "tip": "Keep a trading journal. Document your trades, thoughts, and lessons learned."},
    ]
    return tips

@api_router.get("/advisor/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    history = await db.chat_history.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    return history

# ============== WATCHLIST ==============

@api_router.get("/watchlist")
async def get_watchlist(current_user: dict = Depends(get_current_user)):
    watchlist = current_user.get("watchlist", ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"])
    return watchlist

@api_router.post("/watchlist/{symbol}")
async def add_to_watchlist(symbol: str, current_user: dict = Depends(get_current_user)):
    watchlist = current_user.get("watchlist", ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"])
    if symbol.upper() not in watchlist:
        watchlist.append(symbol.upper())
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"watchlist": watchlist}}
        )
    return watchlist

@api_router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str, current_user: dict = Depends(get_current_user)):
    watchlist = current_user.get("watchlist", [])
    if symbol.upper() in watchlist:
        watchlist.remove(symbol.upper())
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"watchlist": watchlist}}
        )
    return watchlist

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "Trading Learning App API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
