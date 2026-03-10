import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created! Welcome to Trading Boi');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900/30 to-[#050505] p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </Link>
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Start Your Journey</h1>
          <p className="text-white/50 max-w-md">Learn to trade with zero risk. Get $100,000 in virtual money to practice.</p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
              <span className="text-sm">Free forever</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
              <span className="text-sm">$100k virtual trading capital</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
              <span className="text-sm">AI-powered trading advisor</span>
            </div>
          </div>
        </div>
        <div className="text-white/30 text-xs">
          Educational platform · Not financial advice
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">Trading Boi</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-white/50 mb-8">Start your trading education today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="register-name-input"
                className="bg-black/50 border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email-input"
                className="bg-black/50 border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password-input"
                className="bg-black/50 border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 h-11"
              />
              <p className="text-xs text-white/40">Minimum 6 characters</p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full bg-blue-600 hover:bg-blue-700 h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-white/50 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300" data-testid="register-login-link">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
