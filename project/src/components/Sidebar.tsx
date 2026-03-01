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
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

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
    { id: 'user-management', label: 'User Management', icon: UserPlus },
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

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

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

        {/* Current user info (static, no switcher) */}
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left text-sm min-w-0">
            <p className="font-semibold truncate">{currentUser?.name}</p>
            <p className="text-xs text-white/70 capitalize">{currentUser?.role}</p>
          </div>
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
