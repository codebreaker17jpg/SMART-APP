import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Circle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, CurriculumTopic, Subject } from '../../lib/supabase';

type SubjectWithTopics = Subject & { topics: CurriculumTopic[] };

export function StudentCurriculum({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadCurriculum();
    }
  }, [currentUser]);

  async function loadCurriculum() {
    if (!currentUser) return;

    try {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*, curriculum_topics(*)')
        .eq('semester', currentUser.semester)
        .order('name');

      if (subjectsData) {
        const formattedData = subjectsData.map((subject) => ({
          ...subject,
          topics: subject.curriculum_topics || [],
        }));
        setSubjects(formattedData);
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Circle className="w-6 h-6 text-slate-300" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in_progress':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-slate-200 bg-white';
    }
  }

  function calculateProgress(topics: CurriculumTopic[]) {
    if (topics.length === 0) return 0;
    const completed = topics.filter(t => t.status === 'completed').length;
    return Math.round((completed / topics.length) * 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Curriculum Progress</h1>
          <p className="text-slate-600">Track your learning journey across all subjects</p>
        </div>
        {onViewChange && (
          <button
            onClick={() => onViewChange('scan')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
          >
            Mark Attendance
          </button>
        )}
      </div>

      <div className="space-y-8">
        {subjects.map((subject) => {
          const progress = calculateProgress(subject.topics);
          const completedTopics = subject.topics.filter(t => t.status === 'completed').length;

          return (
            <div key={subject.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{subject.name}</h2>
                      <p className="text-white/80">{subject.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{progress}%</div>
                    <p className="text-sm text-white/80">Complete</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="mt-3 text-sm text-white/90">
                  {completedTopics} of {subject.topics.length} topics completed
                </div>
              </div>

              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                  <div className="space-y-4">
                    {subject.topics
                      .sort((a, b) => a.order_number - b.order_number)
                      .map((topic, index) => (
                        <div key={topic.id} className="relative flex gap-4">
                          <div className="relative z-10 flex-shrink-0">
                            {getStatusIcon(topic.status)}
                          </div>

                          <div
                            className={`flex-1 p-4 rounded-xl border-2 transition-all ${getStatusColor(
                              topic.status
                            )}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg">
                                  {index + 1}. {topic.title}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">{topic.description}</p>
                              </div>
                              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
                                {topic.estimated_hours}h
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full ${topic.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : topic.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                              >
                                {topic.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
