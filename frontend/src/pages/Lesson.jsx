import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { 
  ArrowLeft, Clock, CheckCircle, ChevronRight, 
  Loader2, BookOpen 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Lesson = () => {
  const { lessonId } = useParams();
  const { token, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const isCompleted = user?.completed_lessons?.includes(lessonId);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`${API}/learn/lesson/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLesson(response.data);
      } catch (error) {
        console.error('Lesson fetch error:', error);
        toast.error('Lesson not found');
        navigate('/learn');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, token, navigate]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const response = await axios.post(`${API}/learn/progress`, 
        { lesson_id: lessonId, completed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ completed_lessons: response.data.completed_lessons });
      toast.success('Lesson completed! Great job!');
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setCompleting(false);
    }
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

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto" data-testid="lesson-main">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Link */}
          <Link 
            to="/learn" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            data-testid="back-to-learn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Academy</span>
          </Link>

          {/* Lesson Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded mb-3">
                  {lesson?.module}
                </span>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                  {lesson?.title}
                </h1>
                <p className="flex items-center gap-2 text-white/50 text-sm mt-2">
                  <Clock className="w-4 h-4" />
                  {lesson?.duration} min read
                </p>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-400">Completed</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Lesson Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#0A0A0A] border-white/10">
              <CardContent className="p-8">
                <div className="prose prose-invert max-w-none">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-white/50 text-sm">Lesson Content</span>
                  </div>
                  <p className="text-white/80 leading-relaxed text-lg whitespace-pre-wrap">
                    {lesson?.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between pt-4"
          >
            <Link to="/learn">
              <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Lessons
              </Button>
            </Link>
            
            {!isCompleted ? (
              <Button 
                onClick={handleComplete}
                disabled={completing}
                data-testid="complete-lesson-btn"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {completing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark as Complete
              </Button>
            ) : (
              <Link to="/learn">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Continue Learning
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Lesson;
