import { useEffect, useState } from 'react';
import { CheckSquare, Square, Clock, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Subject, CurriculumTopic } from '../../lib/supabase';

type SubjectWithTopics = Subject & { topics: CurriculumTopic[] };

export function CurriculumManager() {
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
      const { data } = await supabase
        .from('subjects')
        .select('*, curriculum_topics(*)')
        .eq('teacher_id', currentUser.id)
        .order('name');

      if (data) {
        const formattedData = data.map((subject) => ({
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

  async function updateTopicStatus(topicId: string, newStatus: 'pending' | 'in_progress' | 'completed') {
    try {
      const updateData: { status: string; completed_at?: string } = { status: newStatus };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      await supabase
        .from('curriculum_topics')
        .update(updateData)
        .eq('id', topicId);

      loadCurriculum();
    } catch (error) {
      console.error('Error updating topic:', error);
    }
  }

  function getStatusButton(status: string) {
    const configs = {
      pending: {
        label: 'Not Started',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Square,
      },
      in_progress: {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Clock,
      },
      completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: Check,
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Curriculum Manager</h1>
        <p className="text-slate-600">Track and update teaching progress across your subjects</p>
      </div>

      <div className="space-y-8">
        {subjects.map((subject) => {
          const totalTopics = subject.topics.length;
          const completedTopics = subject.topics.filter(t => t.status === 'completed').length;
          const inProgressTopics = subject.topics.filter(t => t.status === 'in_progress').length;
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          return (
            <div key={subject.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <CheckSquare className="w-6 h-6" />
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

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm text-white/80">Total Topics</p>
                    <p className="text-2xl font-bold">{totalTopics}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm text-white/80">In Progress</p>
                    <p className="text-2xl font-bold">{inProgressTopics}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm text-white/80">Completed</p>
                    <p className="text-2xl font-bold">{completedTopics}</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {subject.topics
                    .sort((a, b) => a.order_number - b.order_number)
                    .map((topic, index) => {
                      const statusConfig = getStatusButton(topic.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={topic.id}
                          className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center font-semibold text-slate-600 border-2 border-slate-200">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 mb-1">{topic.title}</h3>
                            <p className="text-sm text-slate-600 line-clamp-1">{topic.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                {topic.estimated_hours}h
                              </span>
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => updateTopicStatus(topic.id, 'pending')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                topic.status === 'pending'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => updateTopicStatus(topic.id, 'in_progress')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                topic.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
                              }`}
                            >
                              In Progress
                            </button>
                            <button
                              onClick={() => updateTopicStatus(topic.id, 'completed')}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                topic.status === 'completed'
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-green-50'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
