import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { StudentHome } from './views/student/StudentHome';
import { QRScanner } from './views/student/QRScanner';
import { FaceEnrollment } from './views/student/FaceEnrollment';
import { StudentCurriculum } from './views/student/StudentCurriculum';
import { LiveClass } from './views/teacher/LiveClass';
import { TeacherAnalytics } from './views/teacher/TeacherAnalytics';
import { CurriculumManager } from './views/teacher/CurriculumManager';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AttendanceHeatmap } from './views/admin/AttendanceHeatmap';
import { Schedule } from './views/shared/Schedule';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [activeView, setActiveView] = useState(() => {
    if (currentUser?.role === 'student') return 'home';
    if (currentUser?.role === 'teacher') return 'live';
    return 'dashboard';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading EduTrack...</p>
        </div>
      </div>
    );
  }

  function renderView() {
    if (currentUser?.role === 'student') {
      switch (activeView) {
        case 'home':
          return <StudentHome onViewChange={setActiveView} />;
        case 'scan':
          return <QRScanner />;
        case 'face-enrollment':
          return <FaceEnrollment />;
        case 'curriculum':
          return <StudentCurriculum onViewChange={setActiveView} />;
        case 'schedule':
          return <Schedule onViewChange={setActiveView} />;
        default:
          return <StudentHome onViewChange={setActiveView} />;
      }
    }

    if (currentUser?.role === 'teacher') {
      switch (activeView) {
        case 'live':
          return <LiveClass />;
        case 'analytics':
          return <TeacherAnalytics />;
        case 'curriculum-manager':
          return <CurriculumManager />;
        case 'schedule':
          return <Schedule />;
        default:
          return <LiveClass />;
      }
    }

    if (currentUser?.role === 'admin') {
      switch (activeView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'heatmap':
          return <AttendanceHeatmap />;
        case 'students':
          return <AdminDashboard />;
        case 'schedule':
          return <Schedule />;
        default:
          return <AdminDashboard />;
      }
    }

    return <StudentHome />;
  }

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
