import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  BookOpen, Clock, CheckCircle, ChevronRight, 
  Target, LineChart, Shield, Loader2 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Learn = () => {
  const { token } = useAuth();
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [modulesRes, progressRes] = await Promise.all([
          axios.get(`${API}/learn/modules`, { headers }),
          axios.get(`${API}/learn/progress`, { headers })
        ]);
        setModules(modulesRes.data);
        setProgress(progressRes.data);
      } catch (error) {
        console.error('Learn fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const completedLessons = progress?.completed_lessons || [];
  
  const moduleIcons = {
    basics: BookOpen,
    technical: LineChart,
    risk: Shield
  };

  const moduleColors = {
    basics: 'blue',
    technical: 'emerald',
    risk: 'amber'
  };

  const getModuleProgress = (module) => {
    const total = module.lessons.length;
    const completed = module.lessons.filter(l => completedLessons.includes(l.id)).length;
    return { completed, total, percent: (completed / total) * 100 };
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
      <main className="flex-1 p-6 md:p-8 overflow-auto" data-testid="learn-main">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              Trading Academy
            </h1>
            <p className="text-white/50 text-sm mt-1">Master the fundamentals of trading</p>
          </div>

          {/* Overall Progress */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-white">Your Progress</h2>
                    <p className="text-white/50 text-sm">{completedLessons.length} of {progress?.total_lessons} lessons completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-bold text-white">{Math.round(progress?.progress_percent || 0)}%</span>
                </div>
              </div>
              <Progress value={progress?.progress_percent || 0} className="h-2 bg-white/10" />
            </CardContent>
          </Card>

          {/* Modules */}
          <div className="space-y-6">
            {modules.map((module, index) => {
              const Icon = moduleIcons[module.id] || BookOpen;
              const color = moduleColors[module.id] || 'blue';
              const prog = getModuleProgress(module);

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-[#0A0A0A] border-white/10 overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 text-${color}-500`} />
                          </div>
                          <div>
                            <CardTitle className="font-heading text-lg text-white">{module.title}</CardTitle>
                            <p className="text-white/50 text-sm mt-1">{module.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-white/20 text-white/60">
                            {prog.completed}/{prog.total} lessons
                          </Badge>
                        </div>
                      </div>
                      <Progress value={prog.percent} className="h-1 mt-4 bg-white/10" />
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-white/5">
                        {module.lessons.map((lesson) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          return (
                            <Link
                              key={lesson.id}
                              to={`/learn/${lesson.id}`}
                              data-testid={`lesson-${lesson.id}`}
                              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-emerald-500/20' : 'bg-white/5'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-white/30" />
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${isCompleted ? 'text-white/60' : 'text-white'}`}>
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {lesson.duration} min
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Learn;
