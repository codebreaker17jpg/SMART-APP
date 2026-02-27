import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  PieChart,
  QrCode,
  ScanFace,
  BarChart3,
  Calendar,
  GraduationCap,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const studentMenu = [
    { id: 'home', label: 'Progress', icon: LayoutDashboard },
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'scan', label: 'QR Scanner', icon: QrCode },
    { id: 'face-enrollment', label: 'Face Scan', icon: ScanFace },
  ];

  const teacherNav = [
    { id: 'live', label: 'Live Class', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'curriculum-manager', label: 'Curriculum', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'heatmap', label: 'Heatmap', icon: Calendar },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ];

  const navigation =
    currentUser?.role === 'student' ? studentMenu :
      currentUser?.role === 'teacher' ? teacherNav :
        adminNav;

  const roleColors = {
    student: 'from-blue-500 to-cyan-500',
    teacher: 'from-teal-500 to-emerald-500',
    admin: 'from-slate-600 to-slate-800',
  };

  const bgGradient = currentUser ? roleColors[currentUser.role] : 'from-blue-500 to-cyan-500';

  return (
    <div className={`w-64 bg-gradient-to-b ${bgGradient} text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl`}>
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EduTrack</h1>
            <p className="text-xs text-white/80">Smart Campus</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left text-sm">
              <p className="font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-white/70 capitalize">{currentUser?.role}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setShowUserMenu(false);
                    onViewChange(user.role === 'student' ? 'home' : user.role === 'teacher' ? 'live' : 'dashboard');
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-100 transition-colors ${currentUser?.id === user.id ? 'bg-slate-50' : ''
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${user.role === 'student' ? 'bg-blue-500' :
                    user.role === 'teacher' ? 'bg-teal-500' :
                      'bg-slate-600'
                    }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left text-sm">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        <p className="text-xs text-white/60 text-center">
          Demo Mode - Switch users above
        </p>
      </div>
    </div>
  );
}
