import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Bot, Send, User, Lightbulb, Loader2, 
  MessageSquare, Sparkles, AlertCircle, Image, X, ImagePlus
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Advisor = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tipsRes, historyRes] = await Promise.all([
          axios.get(`${API}/advisor/tips`, { headers }),
          axios.get(`${API}/advisor/history`, { headers })
        ]);
        setTips(tipsRes.data);
        setHistory(historyRes.data);
        
        // Convert history to messages
        const historyMessages = [];
        historyRes.data.slice(0, 10).reverse().forEach(h => {
          historyMessages.push({ 
            role: 'user', 
            content: h.user_message,
            hasImage: h.has_image 
          });
          historyMessages.push({ role: 'assistant', content: h.ai_response });
        });
        setMessages(historyMessages);
      } catch (error) {
        console.error('Advisor data error:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userMessage = input.trim() || (selectedImage ? 'Please analyze this chart' : '');
    const hasImage = !!selectedImage;
    
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      hasImage,
      imagePreview: imagePreview 
    }]);
    setLoading(true);

    try {
      let response;
      
      if (selectedImage) {
        // Send with image
        const formData = new FormData();
        formData.append('message', userMessage);
        formData.append('image', selectedImage);
        
        response = await axios.post(`${API}/advisor/chat-with-image`, formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        });
        clearImage();
      } else {
        // Text only
        response = await axios.post(`${API}/advisor/chat`, 
          { message: userMessage },
          { headers }
        );
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again later.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What is RSI and how do I use it?",
    "Explain the difference between SMA and EMA",
    "How do I manage risk in trading?",
    "What's a good strategy for beginners?",
    "How do I read candlestick patterns?"
  ];

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-hidden" data-testid="advisor-main">
        <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Bot className="w-8 h-8 text-blue-500" />
                AI Trading Advisor
              </h1>
              <p className="text-white/50 text-sm mt-1">Ask questions or upload charts for AI analysis</p>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 bg-[#0A0A0A] border-white/10 flex flex-col min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 && !historyLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      Welcome, {user?.name?.split(' ')[0]}!
                    </h3>
                    <p className="text-white/50 text-sm max-w-md mb-6">
                      I'm your AI trading advisor. Ask me about trading strategies, technical analysis, 
                      or upload a chart screenshot for detailed analysis.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {suggestedQuestions.slice(0, 3).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(q)}
                          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-blue-400" />
                          </div>
                        )}
                        <div className={`max-w-[80%] p-4 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white/5 text-white/90'
                        }`}>
                          {msg.imagePreview && (
                            <div className="mb-3">
                              <img 
                                src={msg.imagePreview} 
                                alt="Uploaded chart" 
                                className="max-w-full max-h-48 rounded-lg border border-white/10"
                              />
                            </div>
                          )}
                          {msg.hasImage && !msg.imagePreview && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-white/60">
                              <Image className="w-3 h-3" />
                              <span>Image attached</span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-white/50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">{selectedImage ? 'Analyzing image...' : 'Thinking...'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Image Preview */}
              {imagePreview && (
                <div className="px-4 pb-2">
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-20 rounded-lg border border-white/20"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    data-testid="attach-image-btn"
                    className="border-white/10 bg-transparent hover:bg-white/5 flex-shrink-0"
                    title="Attach chart image"
                  >
                    <ImagePlus className="w-4 h-4 text-white/60" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={selectedImage ? "Describe what you'd like analyzed..." : "Ask about trading strategies, technical analysis..."}
                    data-testid="advisor-input"
                    className="flex-1 bg-black/50 border-white/10 focus:border-blue-500/50"
                    disabled={loading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || (!input.trim() && !selectedImage)}
                    data-testid="advisor-send-btn"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Tip: Upload chart screenshots for pattern analysis and trading insights
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar - Tips */}
          <div className="w-full md:w-80 space-y-4">
            {/* Image Analysis Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Image className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">Chart Analysis</h3>
                    <p className="text-xs text-white/50 mt-1">
                      Upload trading charts, candlestick patterns, or indicator screenshots for AI-powered analysis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-[#0A0A0A] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Trading Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.map((tip) => (
                  <div key={tip.id} className="p-3 rounded bg-white/5 border border-white/5">
                    <span className="text-xs font-mono text-blue-400 uppercase">{tip.category}</span>
                    <p className="text-sm text-white/70 mt-1 leading-relaxed">{tip.tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            <Card className="bg-[#0A0A0A] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Try Asking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="w-full text-left p-2.5 rounded bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-400/90 font-medium">Educational Content Only</p>
                    <p className="text-xs text-amber-400/60 mt-1">
                      This is not financial advice. Always do your own research before making investment decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Advisor;
