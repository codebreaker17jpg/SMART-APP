import { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type HeatmapData = {
  subject: string;
  code: string;
  room: string;
  day: string;
  time: string;
  occupancy: number;
  total: number;
};

export function AttendanceHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
  ];

  useEffect(() => {
    loadHeatmapData();
  }, [selectedDay]);

  async function loadHeatmapData() {
    try {
      const { data: schedules } = await supabase
        .from('class_schedule')
        .select('*, subjects(*)')
        .eq('day_of_week', selectedDay);

      if (schedules) {
        const today = new Date();
        const dayOffset = selectedDay - today.getDay();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const dateString = targetDate.toISOString().split('T')[0];

        const heatmapPromises = schedules.map(async (schedule) => {
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('subject_id', schedule.subject_id)
            .eq('class_date', dateString);

          const { data: students } = await supabase
            .from('students')
            .select('id');

          const totalStudents = students?.length || 0;
          const presentStudents = attendance?.filter(a => a.status === 'present').length || 0;
          const occupancyRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

          return {
            subject: schedule.subjects.name,
            code: schedule.subjects.code,
            room: schedule.room_number,
            day: days.find(d => d.id === selectedDay)?.name || '',
            time: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`,
            occupancy: occupancyRate,
            total: totalStudents,
          };
        });

        const data = await Promise.all(heatmapPromises);
        setHeatmapData(data.sort((a, b) => a.time.localeCompare(b.time)));
      }
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getOccupancyColor(occupancy: number) {
    if (occupancy >= 90) return 'from-green-500 to-emerald-600';
    if (occupancy >= 75) return 'from-blue-500 to-cyan-600';
    if (occupancy >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  }

  function getOccupancyLabel(occupancy: number) {
    if (occupancy >= 90) return 'Excellent';
    if (occupancy >= 75) return 'Good';
    if (occupancy >= 60) return 'Average';
    return 'Low';
  }

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Campus Attendance Heatmap</h1>
        <p className="text-slate-600">Real-time visualization of classroom occupancy across campus</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Day</label>
        <div className="flex gap-2">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${selectedDay === day.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300'
                }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {days.find(d => d.id === selectedDay)?.name} Classes
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600"></div>
              <span className="text-slate-600">Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-600"></div>
              <span className="text-slate-600">Good (75-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-500 to-orange-600"></div>
              <span className="text-slate-600">Average (60-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-rose-600"></div>
              <span className="text-slate-600">Low (&lt;60%)</span>
            </div>
          </div>
        </div>

        {heatmapData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapData.map((item, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-105`}
              >
                <div className={`bg-gradient-to-br ${getOccupancyColor(item.occupancy)} p-6 text-white`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm">{item.code}</span>
                    </div>
                    <span className="text-3xl font-bold">{item.occupancy}%</span>
                  </div>

                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.subject}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{item.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>Room {item.room}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/80">Status</span>
                      <span className="font-semibold">{getOccupancyLabel(item.occupancy)}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${item.occupancy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No classes scheduled for this day</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-semibold mb-2">Average Occupancy</h3>
          <p className="text-4xl font-bold">
            {heatmapData.length > 0
              ? Math.round(heatmapData.reduce((acc, item) => acc + item.occupancy, 0) / heatmapData.length)
              : 0}%
          </p>
          <p className="text-white/80 text-sm mt-2">Across all classes today</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-semibold mb-2">Peak Class</h3>
          <p className="text-4xl font-bold">
            {heatmapData.length > 0
              ? Math.max(...heatmapData.map(d => d.occupancy))
              : 0}%
          </p>
          <p className="text-white/80 text-sm mt-2">Highest attendance rate</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-semibold mb-2">Classes Today</h3>
          <p className="text-4xl font-bold">{heatmapData.length}</p>
          <p className="text-white/80 text-sm mt-2">Scheduled sessions</p>
        </div>
      </div>
    </div>
  );
}
