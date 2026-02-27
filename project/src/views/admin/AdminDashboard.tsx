import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';

type SubjectAttendance = {
  name: string;
  attendance: number;
};

export function AdminDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [averageAttendance, setAverageAttendance] = useState(0);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const { count: facultyCount } = await supabase
        .from('faculties')
        .select('*', { count: 'exact', head: true });

      setTotalStudents(studentCount || 0);
      setTotalTeachers(facultyCount || 0);

      const { data: subjects } = await supabase.from('subjects').select('*');
      setTotalSubjects(subjects?.length || 0);

      const { data: attendance } = await supabase.from('attendance_records').select('*');

      if (attendance && attendance.length > 0) {
        const present = attendance.filter(a => a.status === 'present').length;
        const avgAttendance = Math.round((present / attendance.length) * 100);
        setAverageAttendance(avgAttendance);
      }

      if (subjects && attendance) {
        const subjectStats = subjects.map(subject => {
          const subjectRecords = attendance.filter(a => a.subject_id === subject.id);
          const presentRecords = subjectRecords.filter(a => a.status === 'present').length;
          const attendanceRate = subjectRecords.length > 0
            ? Math.round((presentRecords / subjectRecords.length) * 100)
            : 0;

          return {
            name: subject.code,
            attendance: attendanceRate,
          };
        });

        setSubjectAttendance(subjectStats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const attendanceDistribution = [
    { name: 'Excellent (>90%)', value: subjectAttendance.filter(s => s.attendance > 90).length, color: '#10b981' },
    { name: 'Good (75-90%)', value: subjectAttendance.filter(s => s.attendance >= 75 && s.attendance <= 90).length, color: '#3b82f6' },
    { name: 'Average (60-75%)', value: subjectAttendance.filter(s => s.attendance >= 60 && s.attendance < 75).length, color: '#f59e0b' },
    { name: 'Poor (<60%)', value: subjectAttendance.filter(s => s.attendance < 60).length, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Comprehensive overview of campus-wide metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{totalStudents}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Students</h3>
          <p className="text-white/80 text-sm">Enrolled this semester</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{totalTeachers}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Teachers</h3>
          <p className="text-white/80 text-sm">Active faculty</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{totalSubjects}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Subjects</h3>
          <p className="text-white/80 text-sm">Active courses</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-4xl font-bold">{averageAttendance}%</span>
          </div>
          <h3 className="text-lg font-semibold">Avg Attendance</h3>
          <p className="text-white/80 text-sm">Campus-wide</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Subject-wise Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attendanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attendanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {averageAttendance < 75 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Campus-wide Attendance Alert</h3>
              <p className="text-amber-800 text-sm mb-3">
                The overall campus attendance is below the recommended threshold of 75%.
                Consider implementing engagement initiatives or reviewing policies.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
                  View Detailed Report
                </button>
                <button className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 rounded-lg text-sm font-medium transition-colors">
                  Send Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
