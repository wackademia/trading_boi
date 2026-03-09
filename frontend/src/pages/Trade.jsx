import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, TrendingDown, Search, DollarSign, 
  ArrowUpCircle, ArrowDownCircle, Loader2, RefreshCw,
  BarChart3, Activity
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Trade = () => {
  const { token } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [indicatorData, setIndicatorData] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [selectedIndicator, setSelectedIndicator] = useState('RSI');
  const [trading, setTrading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [portfolioRes, historyRes] = await Promise.all([
          axios.get(`${API}/portfolio`, { headers }),
          axios.get(`${API}/portfolio/history`, { headers })
        ]);
        setPortfolio(portfolioRes.data);
        setTradeHistory(historyRes.data);
      } catch (error) {
        console.error('Initial data error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [token]);

  const searchStocks = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(`${API}/stocks/search?query=${searchQuery}`, { headers });
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  }, [searchQuery, token]);

  const selectStock = async (symbol) => {
    setSelectedStock(symbol);
    setSearchResults([]);
    setSearchQuery(symbol);
    setQuoteLoading(true);
    setChartLoading(true);

    try {
      const [quoteRes, chartRes, indicatorRes] = await Promise.all([
        axios.get(`${API}/stocks/${symbol}/quote`, { headers }),
        axios.get(`${API}/stocks/${symbol}/chart?interval=daily`, { headers }),
        axios.get(`${API}/stocks/${symbol}/indicators?indicator=${selectedIndicator}`, { headers })
      ]);
      setStockQuote(quoteRes.data);
      setChartData(chartRes.data.data);
      setIndicatorData(indicatorRes.data.data);
    } catch (error) {
      toast.error('Failed to load stock data');
    } finally {
      setQuoteLoading(false);
      setChartLoading(false);
    }
  };

  const loadIndicator = async (indicator) => {
    if (!selectedStock) return;
    setSelectedIndicator(indicator);
    try {
      const response = await axios.get(`${API}/stocks/${selectedStock}/indicators?indicator=${indicator}`, { headers });
      setIndicatorData(response.data.data);
    } catch (error) {
      console.error('Indicator error:', error);
    }
  };

  const executeTrade = async (action) => {
    if (!stockQuote || tradeQuantity < 1) return;
    
    const totalCost = stockQuote.price * tradeQuantity;
    if (action === 'buy' && totalCost > portfolio.cash) {
      toast.error('Insufficient funds');
      return;
    }

    setTrading(true);
    try {
      await axios.post(`${API}/portfolio/trade`, {
        symbol: stockQuote.symbol,
        action,
        quantity: tradeQuantity,
        price: stockQuote.price
      }, { headers });

      const [portfolioRes, historyRes] = await Promise.all([
        axios.get(`${API}/portfolio`, { headers }),
        axios.get(`${API}/portfolio/history`, { headers })
      ]);
      setPortfolio(portfolioRes.data);
      setTradeHistory(historyRes.data);
      
      toast.success(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${tradeQuantity} shares of ${stockQuote.symbol}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade failed');
    } finally {
      setTrading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050505]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto" data-testid="trade-main">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">Paper Trading</h1>
              <p className="text-white/50 text-sm mt-1">Practice trading with virtual money</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-white/50">Available Cash</p>
                <p className="font-mono text-lg text-emerald-500" data-testid="trade-cash">{formatCurrency(portfolio?.cash || 0)}</p>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart & Stock Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        placeholder="Search stocks (e.g., AAPL, MSFT)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchStocks()}
                        data-testid="stock-search-input"
                        className="pl-10 bg-black/50 border-white/10 focus:border-blue-500/50"
                      />
                    </div>
                    <Button onClick={searchStocks} data-testid="search-btn" className="bg-blue-600 hover:bg-blue-700">
                      Search
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-white/10 rounded-lg overflow-hidden">
                      {searchResults.map((result) => (
                        <button
                          key={result.symbol}
                          onClick={() => selectStock(result.symbol)}
                          className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono text-white">{result.symbol}</span>
                            <span className="text-white/50 text-sm ml-2">{result.name}</span>
                          </div>
                          <span className="text-xs text-white/40">{result.region}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Quote */}
              {stockQuote && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0A0A0A] border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="font-mono text-2xl font-bold text-white">{stockQuote.symbol}</h2>
                          <p className="text-white/50 text-sm">Last updated: {stockQuote.timestamp}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-3xl font-bold text-white">{formatCurrency(stockQuote.price)}</p>
                          <p className={`font-mono text-sm flex items-center justify-end gap-1 ${stockQuote.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {stockQuote.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stockQuote.change >= 0 ? '+' : ''}{stockQuote.change.toFixed(2)} ({stockQuote.change_percent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 rounded bg-white/5">
                          <p className="text-xs text-white/50">Open</p>
                          <p className="font-mono text-white">{formatCurrency(stockQuote.open)}</p>
                        </div>
                        <div className="p-3 rounded bg-white/5">
                          <p className="text-xs text-white/50">High</p>
                          <p className="font-mono text-white">{formatCurrency(stockQuote.high)}</p>
                        </div>
                        <div className="p-3 rounded bg-white/5">
                          <p className="text-xs text-white/50">Low</p>
                          <p className="font-mono text-white">{formatCurrency(stockQuote.low)}</p>
                        </div>
                        <div className="p-3 rounded bg-white/5">
                          <p className="text-xs text-white/50">Volume</p>
                          <p className="font-mono text-white">{formatNumber(stockQuote.volume)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Chart */}
              {chartData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-[#0A0A0A] border-white/10">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-500" />
                          Price Chart
                        </CardTitle>
                        <Button variant="outline" size="sm" className="border-white/10 bg-transparent hover:bg-white/5" onClick={() => selectStock(selectedStock)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                              itemStyle={{ color: '#3B82F6' }}
                            />
                            <Area type="monotone" dataKey="close" stroke="#3B82F6" fill="url(#colorPrice)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Indicators */}
              {indicatorData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="bg-[#0A0A0A] border-white/10">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-emerald-500" />
                          Technical Indicators
                        </CardTitle>
                        <Select value={selectedIndicator} onValueChange={loadIndicator}>
                          <SelectTrigger className="w-32 bg-black/50 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121212] border-white/10">
                            <SelectItem value="RSI">RSI</SelectItem>
                            <SelectItem value="MACD">MACD</SelectItem>
                            <SelectItem value="SMA">SMA</SelectItem>
                            <SelectItem value="EMA">EMA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={indicatorData}>
                            <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey={selectedIndicator} stroke="#10B981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {selectedIndicator === 'RSI' && indicatorData[indicatorData.length - 1] && (
                        <div className="mt-4 p-3 rounded bg-white/5 text-sm">
                          <p className="text-white/70">
                            Current RSI: <span className="font-mono text-emerald-400">{indicatorData[indicatorData.length - 1].RSI?.toFixed(2)}</span>
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            {indicatorData[indicatorData.length - 1].RSI > 70 ? '⚠️ Overbought territory (potential sell signal)' : 
                             indicatorData[indicatorData.length - 1].RSI < 30 ? '⚠️ Oversold territory (potential buy signal)' : 
                             '✓ Neutral range'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Trade Panel & History */}
            <div className="space-y-6">
              {/* Trade Panel */}
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="font-heading text-lg text-white">Execute Trade</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {stockQuote ? (
                    <>
                      <div className="p-4 rounded bg-white/5 text-center">
                        <p className="text-sm text-white/50">Trading</p>
                        <p className="font-mono text-xl font-bold text-white">{stockQuote.symbol}</p>
                        <p className="font-mono text-lg text-blue-400">{formatCurrency(stockQuote.price)}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tradeQuantity}
                          onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                          data-testid="trade-quantity-input"
                          className="bg-black/50 border-white/10 font-mono text-center text-lg"
                        />
                      </div>
                      <div className="p-3 rounded bg-white/5">
                        <p className="text-xs text-white/50">Total Value</p>
                        <p className="font-mono text-xl text-white">{formatCurrency(stockQuote.price * tradeQuantity)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => executeTrade('buy')} 
                          disabled={trading || stockQuote.price * tradeQuantity > portfolio.cash}
                          data-testid="buy-btn"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {trading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                          Buy
                        </Button>
                        <Button 
                          onClick={() => executeTrade('sell')} 
                          disabled={trading}
                          data-testid="sell-btn"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {trading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
                          Sell
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/50">Search for a stock to trade</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Positions */}
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="font-heading text-lg text-white">Your Positions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {portfolio?.positions?.length > 0 ? (
                    <div className="divide-y divide-white/5 max-h-[300px] overflow-auto">
                      {portfolio.positions.map((pos) => (
                        <button
                          key={pos.symbol}
                          onClick={() => selectStock(pos.symbol)}
                          className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-white">{pos.symbol}</p>
                              <p className="text-xs text-white/40">{pos.quantity} shares @ {formatCurrency(pos.avg_price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-white">{formatCurrency(pos.total_value)}</p>
                              <p className={`text-xs font-mono ${pos.profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {pos.profit_loss >= 0 ? '+' : ''}{formatCurrency(pos.profit_loss)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/50 text-sm">No positions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="font-heading text-lg text-white">Recent Trades</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {tradeHistory.length > 0 ? (
                    <div className="divide-y divide-white/5 max-h-[250px] overflow-auto">
                      {tradeHistory.slice(0, 10).map((trade) => (
                        <div key={trade.id} className="p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-mono ${trade.action === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {trade.action.toUpperCase()}
                              </span>
                              <span className="font-mono text-white">{trade.symbol}</span>
                            </div>
                            <span className="font-mono text-white/70">{formatCurrency(trade.total)}</span>
                          </div>
                          <p className="text-xs text-white/40 mt-1">{trade.quantity} shares @ {formatCurrency(trade.price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Activity className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/50 text-sm">No trades yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trade;
