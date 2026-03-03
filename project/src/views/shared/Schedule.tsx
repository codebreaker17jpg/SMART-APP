import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type ScheduleItem = {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string;
};

type SubjectSelectData = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  roomNumber: string;
};

export function Schedule({ onViewChange, onSubjectSelect }: {
  onViewChange?: (view: string) => void;
  onSubjectSelect?: (data: SubjectSelectData) => void;
}) {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [liveSubjectIds, setLiveSubjectIds] = useState<Set<string>>(new Set());

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['09:00', '09:45', '10:45', '11:30', '13:00', '14:00', '16:00'];

  useEffect(() => {
    if (currentUser) {
      loadSchedule();
      loadLiveSessions();
    }
  }, [currentUser]);

  // Realtime subscription for live session changes
  useEffect(() => {
    const channel = supabase
      .channel('live_sessions_schedule')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_sessions' },
        () => { loadLiveSessions(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadLiveSessions() {
    const { data } = await supabase
      .from('live_sessions')
      .select('subject_id')
      .eq('is_active', true);

    if (data) {
      setLiveSubjectIds(new Set(data.map(s => s.subject_id)));
    }
  }

  async function loadSchedule() {
    if (!currentUser) return;

    try {
      let query = supabase
        .from('class_schedule')
        .select('*, subjects!inner(*)');

      if (currentUser.role === 'teacher') {
        query = query.eq('subjects.teacher_id', currentUser.id);
      }

      const { data } = await query;

      if (data) {
        const formattedData = data.map((item) => ({
          id: item.id,
          subject_id: item.subject_id,
          subject_name: item.subjects?.name || 'Unknown Subject',
          subject_code: item.subjects?.code || 'UNK',
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          room_number: item.room_number,
        }));
        setSchedule(formattedData);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  function getScheduleForDay(dayIndex: number) {
    return schedule.filter(s => s.day_of_week === dayIndex);
  }

  function getColorForSubject(code: string) {
    if (!code) return 'from-slate-400 to-slate-500';
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-teal-500 to-emerald-500',
      'from-violet-500 to-purple-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
    ];
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Schedule</h1>
          <p className="text-slate-600">Your complete timetable for the week</p>
        </div>
        {onViewChange && currentUser?.role === 'student' && (
          <button
            onClick={() => onViewChange('scan')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
          >
            Mark Attendance
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 gap-px bg-slate-200">
              <div className="bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Time</span>
                </div>
              </div>
              {days.slice(1, 6).map((day) => (
                <div key={day} className="bg-slate-50 p-4 text-center">
                  <div className="font-bold text-slate-900">{day}</div>
                </div>
              ))}
            </div>

            {timeSlots.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-6 gap-px bg-slate-200 min-h-32">
                <div className="bg-white p-4 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">{timeSlot}</span>
                </div>
                {days.slice(1, 6).map((day, dayIndex) => {
                  const daySchedule = getScheduleForDay(dayIndex + 1);
                  const classAtTime = daySchedule.find(s =>
                    s.start_time.startsWith(timeSlot)
                  );

                  return (
                    <div key={`${day}-${timeSlot}`} className="bg-white p-2 overflow-visible relative z-0">
                      {classAtTime ? (
                        <div
                          onClick={() => {
                            if (onSubjectSelect && currentUser?.role === 'student') {
                              onSubjectSelect({
                                subjectId: classAtTime.subject_id,
                                subjectName: classAtTime.subject_name,
                                subjectCode: classAtTime.subject_code,
                                roomNumber: classAtTime.room_number,
                              });
                            } else {
                              setSelectedClass(classAtTime);
                            }
                          }}
                          className={`h-full bg-gradient-to-br ${getColorForSubject(
                            classAtTime.subject_code
                          )} rounded-lg p-3 text-white shadow-md hover:shadow-lg hover:scale-105 cursor-pointer transition-all ${liveSubjectIds.has(classAtTime.subject_id)
                            ? 'ring-2 ring-green-400 ring-offset-2 animate-pulse shadow-green-400/50 shadow-lg'
                            : ''
                            }`}
                        >
                          <div className="font-bold text-sm mb-1">{classAtTime.subject_code}</div>
                          <div className="text-xs mb-2 line-clamp-2">{classAtTime.subject_name}</div>
                          <div className="flex items-center gap-1 text-xs text-white/90 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {classAtTime.start_time.slice(0, 5)} - {classAtTime.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-white/90">
                            <MapPin className="w-3 h-3" />
                            <span>{classAtTime.room_number}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300">
                          <span className="text-xs">Free</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...new Set(schedule.map(s => s.subject_code))].map((code) => {
          const subject = schedule.find(s => s.subject_code === code)!;
          const classCount = schedule.filter(s => s.subject_code === code).length;

          return (
            <div
              key={code}
              className={`bg-gradient-to-br ${getColorForSubject(code)} rounded-xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-lg">{code}</div>
                  <div className="text-sm text-white/90 line-clamp-2">{subject.subject_name}</div>
                </div>
                <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                  {classCount}x/week
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Details Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200">
            <div className={`bg-gradient-to-br ${getColorForSubject(selectedClass.subject_code)} p-6 text-white`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedClass.subject_code}</h3>
                  <p className="text-white/90">{selectedClass.subject_name}</p>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Time</p>
                    <p className="font-semibold">{selectedClass.start_time.slice(0, 5)} - {selectedClass.end_time.slice(0, 5)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-semibold">Room {selectedClass.room_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Day</p>
                    <p className="font-semibold">{days[selectedClass.day_of_week]}</p>
                  </div>
                </div>
              </div>

              {onViewChange && currentUser?.role === 'student' && (
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    onViewChange('scan');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
                >
                  Mark Attendance
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
