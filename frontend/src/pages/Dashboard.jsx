import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, BookOpen, 
  Target, Bot, ArrowRight, Loader2 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, token } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [portfolioRes, progressRes, tipsRes] = await Promise.all([
          axios.get(`${API}/portfolio`, { headers }),
          axios.get(`${API}/learn/progress`, { headers }),
          axios.get(`${API}/advisor/tips`, { headers })
        ]);
        setPortfolio(portfolioRes.data);
        setProgress(progressRes.data);
        setTips(tipsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercent = (value) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

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

  const profitLossPercent = portfolio ? ((portfolio.total_profit_loss / 100000) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto" data-testid="dashboard-main">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-white/50 text-sm mt-1">Your trading education dashboard</p>
            </div>
            <Link to="/trade">
              <Button data-testid="dashboard-trade-btn" className="bg-blue-600 hover:bg-blue-700">
                Start Trading
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Portfolio Value</span>
                    <DollarSign className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="font-mono text-2xl font-semibold text-white" data-testid="portfolio-value">
                    {formatCurrency(portfolio?.total_value || 100000)}
                  </p>
                  <p className={`text-xs font-mono mt-1 ${profitLossPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatPercent(profitLossPercent)} all time
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Available Cash</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="font-mono text-2xl font-semibold text-white" data-testid="cash-value">
                    {formatCurrency(portfolio?.cash || 100000)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">Ready to invest</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">P/L Today</span>
                    {(portfolio?.total_profit_loss || 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className={`font-mono text-2xl font-semibold ${(portfolio?.total_profit_loss || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(portfolio?.total_profit_loss || 0)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">Paper trading</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Learning Progress</span>
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="font-mono text-2xl font-semibold text-white" data-testid="progress-value">
                    {Math.round(progress?.progress_percent || 0)}%
                  </p>
                  <Progress value={progress?.progress_percent || 0} className="h-1 mt-2 bg-white/10" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Positions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="bg-[#0A0A0A] border-white/10">
                <CardHeader className="border-b border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg text-white">Open Positions</CardTitle>
                    <Link to="/trade" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {portfolio?.positions?.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {portfolio.positions.slice(0, 5).map((pos) => (
                        <div key={pos.symbol} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center">
                              <span className="font-mono text-xs text-blue-400">{pos.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{pos.symbol}</p>
                              <p className="text-xs text-white/40">{pos.quantity} shares</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-white">{formatCurrency(pos.current_price)}</p>
                            <p className={`text-xs font-mono ${pos.profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {formatPercent(pos.profit_loss_percent)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Target className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/50 mb-4">No positions yet</p>
                      <Link to="/trade">
                        <Button variant="outline" size="sm" className="border-white/10 bg-transparent hover:bg-white/5">
                          Make your first trade
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="bg-[#0A0A0A] border-white/10 h-full">
                <CardHeader className="border-b border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-500" />
                      Trading Tips
                    </CardTitle>
                    <Link to="/advisor" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                      Ask AI <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {tips.map((tip) => (
                    <div key={tip.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-xs font-mono text-blue-400 uppercase">{tip.category}</span>
                      <p className="text-sm text-white/70 mt-1 leading-relaxed">{tip.tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/learn" className="data-card flex items-center gap-4 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-white">Continue Learning</p>
                <p className="text-sm text-white/50">{progress?.completed_lessons?.length || 0} of {progress?.total_lessons || 10} lessons</p>
              </div>
            </Link>

            <Link to="/trade" className="data-card flex items-center gap-4 hover:border-emerald-500/30 transition-colors group">
              <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-white">Paper Trading</p>
                <p className="text-sm text-white/50">Practice risk-free</p>
              </div>
            </Link>

            <Link to="/advisor" className="data-card flex items-center gap-4 hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 rounded bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-white">AI Advisor</p>
                <p className="text-sm text-white/50">Get personalized tips</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
