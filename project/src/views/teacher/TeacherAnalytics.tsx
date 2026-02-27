import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Subject } from '../../lib/supabase';

type AttendanceStats = {
  date: string;
  present: number;
  absent: number;
  late: number;
};

export function TeacherAnalytics() {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceStats[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [averageAttendance, setAverageAttendance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSubjects();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedSubject) {
      loadAnalytics();
    }
  }, [selectedSubject]);

  async function loadSubjects() {
    if (!currentUser) return;

    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('teacher_id', currentUser.id)
        .order('name');

      if (data && data.length > 0) {
        setSubjects(data);
        setSelectedSubject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    if (!selectedSubject) return;

    try {
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('subject_id', selectedSubject)
        .order('class_date', { ascending: true });

      if (attendance) {
        const dateMap = new Map<string, { present: number; absent: number; late: number }>();

        attendance.forEach((record) => {
          const date = record.class_date;
          if (!dateMap.has(date)) {
            dateMap.set(date, { present: 0, absent: 0, late: 0 });
          }
          const stats = dateMap.get(date)!;
          if (record.status === 'present') stats.present++;
          else if (record.status === 'absent') stats.absent++;
          else if (record.status === 'late') stats.late++;
        });

        const chartData = Array.from(dateMap.entries())
          .map(([date, stats]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...stats,
          }))
          .slice(-14);

        setAttendanceData(chartData);

        const uniqueStudents = new Set(attendance.map(a => a.student_id));
        setTotalStudents(uniqueStudents.size);

        const presentCount = attendance.filter(a => a.status === 'present').length;
        const avgAttendance = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
        setAverageAttendance(avgAttendance);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Class Analytics</h1>
        <p className="text-slate-600">Track attendance trends and student engagement</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Subject
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="max-w-md px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none"
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{totalStudents}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Students</h3>
          <p className="text-white/80 text-sm">Enrolled in this subject</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{averageAttendance}%</span>
          </div>
          <h3 className="text-lg font-semibold">Avg Attendance</h3>
          <p className="text-white/80 text-sm">Overall rate</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{attendanceData.length}</span>
          </div>
          <h3 className="text-lg font-semibold">Classes Held</h3>
          <p className="text-white/80 text-sm">Last 2 weeks</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} name="Present" />
            <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} name="Late" />
            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} name="Absent" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Bar dataKey="present" fill="#10b981" name="Present" radius={[8, 8, 0, 0]} />
            <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[8, 8, 0, 0]} />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {averageAttendance < 75 && (
        <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Low Attendance Alert</h3>
              <p className="text-amber-800 text-sm">
                The average attendance for this subject is below 75%. Consider reaching out to students
                or reviewing engagement strategies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
