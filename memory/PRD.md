# TradeLearn - Trading Learning App PRD

## Original Problem Statement
Build an app that helps users learn how to trade using Vantage (Alpha Vantage), providing pointers and recommendations with AI assistance.

## User Choices
- **Data Source**: Alpha Vantage API for stock market data
- **Features**: All aspects - basics, technical analysis, paper trading, AI tips
- **AI Integration**: GPT-5.2 for trading recommendations
- **Authentication**: JWT-based user accounts

## Architecture

### Backend (FastAPI)
- **Auth**: JWT-based registration/login
- **Stock Data**: Alpha Vantage integration for quotes, charts, indicators
- **Paper Trading**: Virtual $100k portfolio, buy/sell simulation
- **Learning System**: Structured modules with progress tracking
- **AI Advisor**: GPT-5.2 chat integration via Emergent LLM key

### Frontend (React)
- **Theme**: Obsidian Terminal - dark mode trading interface
- **Typography**: Manrope (headings), IBM Plex Sans (body), JetBrains Mono (data)
- **Components**: Shadcn UI with custom styling
- **Charts**: Recharts for price and indicator visualization

### Database (MongoDB)
- Users collection (auth, portfolio, progress)
- Trades collection (transaction history)
- Chat history collection (AI conversations)

## What's Been Implemented ✅
- [x] Landing page with features overview
- [x] User registration & login (JWT auth)
- [x] Dashboard with portfolio stats
- [x] Learning modules (Basics, Technical Analysis, Risk Management)
- [x] 10 educational lessons with progress tracking
- [x] Paper trading simulator ($100k virtual money)
- [x] Stock search and quote display
- [x] Price charts with technical indicators (RSI, MACD, SMA, EMA)
- [x] AI Trading Advisor with GPT-5.2
- [x] Trade history tracking
- [x] Responsive sidebar navigation

## Prioritized Backlog

### P0 (Critical)
- None - Core functionality complete

### P1 (High Priority)
- Upgrade Alpha Vantage API key for full market data access
- Add real-time price updates (WebSocket)
- Portfolio performance charts over time

### P2 (Medium Priority)
- Quiz system for lessons
- Achievement/badge system
- Watchlist management
- Stock comparison tools
- Market news integration

### P3 (Nice to Have)
- Social features (share trades)
- Leaderboard for paper trading
- Email notifications
- Mobile app optimization

## Next Action Items
1. Consider upgrading Alpha Vantage key for full stock data
2. Add quiz feature to validate learning
3. Implement watchlist with price alerts
4. Add portfolio history charts

---
*Last Updated: January 2026*
