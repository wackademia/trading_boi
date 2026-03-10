import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { TrendingUp, BookOpen, Bot, LineChart, Shield, Zap } from 'lucide-react';

const Landing = () => {
  const features = [
    { icon: BookOpen, title: 'Learn Trading Basics', desc: 'Master market fundamentals, order types, and stock analysis' },
    { icon: LineChart, title: 'Technical Analysis', desc: 'Understand RSI, MACD, moving averages and chart patterns' },
    { icon: TrendingUp, title: 'Paper Trading', desc: 'Practice with $100k virtual money - no risk, real experience' },
    { icon: Bot, title: 'AI Trading Advisor', desc: 'Get personalized tips and answers from GPT-powered assistant' },
    { icon: Shield, title: 'Risk Management', desc: 'Learn position sizing and protect your capital' },
    { icon: Zap, title: 'Real-Time Data', desc: 'Live market data powered by Alpha Vantage' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#050505] to-[#050505]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1760387252509-ecef38b4936e?crop=entropy&cs=srgb&fm=jpg&q=85')] bg-cover bg-center opacity-10" />
        
        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">Trading Boi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" data-testid="nav-login-btn" className="text-white/80 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button data-testid="nav-register-btn" className="bg-blue-600 hover:bg-blue-700 shadow-neon">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center px-6 md:px-12">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded mb-6">
                Learn • Practice • Trade
              </span>
              <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Master Trading
                <span className="block text-gradient">Without the Risk</span>
              </h1>
              <p className="text-lg text-white/60 mb-8 max-w-xl leading-relaxed">
                Learn stock market fundamentals, practice with paper trading, and get AI-powered insights. 
                Start with $100k virtual money and build your skills before risking real capital.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button data-testid="hero-start-btn" size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-neon text-base px-8">
                    Start Learning Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button data-testid="hero-demo-btn" size="lg" variant="outline" className="border-white/10 bg-transparent hover:bg-white/5 text-base px-8">
                    View Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ticker Tape */}
        <div className="relative z-10 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-sm py-3 overflow-hidden">
          <div className="flex gap-8 animate-marquee font-mono text-xs">
            {['AAPL +2.34%', 'GOOGL -0.87%', 'MSFT +1.23%', 'AMZN +0.56%', 'TSLA -1.45%', 'NVDA +3.21%', 'META +0.98%'].map((item, i) => (
              <span key={i} className={item.includes('-') ? 'text-red-500' : 'text-emerald-500'}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything You Need to Learn Trading
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From basics to advanced technical analysis, we've got you covered
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="data-card group"
              >
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-white/50 mb-8">
            Join thousands of learners building their trading skills with zero risk
          </p>
          <Link to="/register">
            <Button data-testid="cta-start-btn" size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-neon text-base px-10">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 md:px-12 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Trading Boi © 2024</span>
          </div>
          <p className="text-white/30 text-xs">
            Educational platform. Not financial advice.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
