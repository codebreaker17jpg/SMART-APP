import { useEffect, useState } from 'react';
import { Flame, Clock, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AttendanceRecord, Achievement, StudentAchievement } from '../../lib/supabase';

export function StudentHome({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const { currentUser } = useAuth();
  const [streak, setStreak] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [nextClass, setNextClass] = useState<{ name: string; time: string; room: string } | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadStudentData();
    }
  }, [currentUser]);

  async function loadStudentData() {
    if (!currentUser) return;

    try {
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', currentUser.id)
        .order('class_date', { ascending: false });

      if (attendance) {
        calculateStreak(attendance);
        calculateAttendancePercentage(attendance);
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const currentTime = today.getHours() * 60 + today.getMinutes();

      const { data: scheduleData } = await supabase
        .from('class_schedule')
        .select('*, subjects(*)')
        .eq('day_of_week', dayOfWeek);

      if (scheduleData && scheduleData.length > 0) {
        const upcoming = scheduleData.find((schedule: { start_time: string }) => {
          const [hours, minutes] = schedule.start_time.split(':');
          const scheduleTime = parseInt(hours) * 60 + parseInt(minutes);
          return scheduleTime > currentTime;
        });

        if (upcoming) {
          setNextClass({
            name: upcoming.subjects?.name || 'Unknown Subject',
            time: upcoming.start_time,
            room: upcoming.room_number,
          });
        }
      }

      const { data: studentAchievements } = await supabase
        .from('student_achievements')
        .select('*, achievements(*)')
        .eq('student_id', currentUser.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (studentAchievements) {
        setAchievements(studentAchievements.map((sa: StudentAchievement & { achievements: Achievement }) => sa.achievements));
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStreak(attendance: AttendanceRecord[]) {
    let currentStreak = 0;
    const sortedAttendance = [...attendance].sort(
      (a, b) => new Date(b.class_date).getTime() - new Date(a.class_date).getTime()
    );

    for (const record of sortedAttendance) {
      if (record.status === 'present') {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }

  function calculateAttendancePercentage(attendance: AttendanceRecord[]) {
    if (attendance.length === 0) {
      setAttendancePercentage(0);
      return;
    }

    const present = attendance.filter(a => a.status === 'present').length;
    const percentage = Math.round((present / attendance.length) * 100);
    setAttendancePercentage(percentage);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {currentUser?.name}!</h1>
        <p className="text-slate-600">Here's your academic progress at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Flame className="w-8 h-8" />
            </div>
            <span className="text-5xl font-bold">{streak}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Attendance Streak</h3>
          <p className="text-white/80 text-sm">Consecutive classes attended</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8" />
            </div>
            <span className="text-5xl font-bold">{attendancePercentage}%</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Overall Attendance</h3>
          <p className="text-white/80 text-sm">This semester</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <span className="text-5xl font-bold">{achievements.length}</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Achievements</h3>
          <p className="text-white/80 text-sm">Badges earned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {nextClass ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Next Class</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Subject</p>
                <p className="text-lg font-semibold text-slate-900">{nextClass.name}</p>
              </div>
              <div className="flex gap-4 mb-2">
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="text-lg font-semibold text-slate-900">{nextClass.time}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Room</p>
                  <p className="text-lg font-semibold text-slate-900">{nextClass.room}</p>
                </div>
              </div>
              {onViewChange && (
                <button
                  onClick={() => onViewChange('scan')}
                  className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Mark Attendance
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">No Upcoming Classes</h2>
            </div>
            <p className="text-slate-600">Enjoy your free time!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Recent Achievements</h2>
          </div>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{achievement.name}</p>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Keep attending classes to earn achievements!</p>
          )}
        </div>
      </div>
    </div>
  );
}
