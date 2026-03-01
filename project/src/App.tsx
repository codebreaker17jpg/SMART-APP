import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './views/auth/Login';

// Student views
import { StudentHome } from './views/student/StudentHome';
import { QRScanner } from './views/student/QRScanner';
import { FaceEnrollment } from './views/student/FaceEnrollment';
import { StudentCurriculum } from './views/student/StudentCurriculum';

// Teacher views
import { LiveClass } from './views/teacher/LiveClass';
import { TeacherAnalytics } from './views/teacher/TeacherAnalytics';
import { CurriculumManager } from './views/teacher/CurriculumManager';

// Admin views
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AttendanceHeatmap } from './views/admin/AttendanceHeatmap';
import { SystemAdminPortal } from './views/admin/SystemAdminPortal';

// Shared views
import { Schedule } from './views/shared/Schedule';

// ── Role Layouts ─────────────────────────────────────────────────────
// Each layout uses the existing activeView + sidebar pattern internally

function StudentLayout() {
  const [activeView, setActiveView] = useState('home');

  function renderView() {
    switch (activeView) {
      case 'home': return <StudentHome onViewChange={setActiveView} />;
      case 'scan': return <QRScanner />;
      case 'face-enrollment': return <FaceEnrollment />;
      case 'curriculum': return <StudentCurriculum onViewChange={setActiveView} />;
      case 'schedule': return <Schedule onViewChange={setActiveView} />;
      default: return <StudentHome onViewChange={setActiveView} />;
    }
  }

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
}

function TeacherLayout() {
  const [activeView, setActiveView] = useState('live');

  function renderView() {
    switch (activeView) {
      case 'live': return <LiveClass />;
      case 'analytics': return <TeacherAnalytics />;
      case 'curriculum-manager': return <CurriculumManager />;
      case 'schedule': return <Schedule />;
      default: return <LiveClass />;
    }
  }

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
}

function AdminLayout() {
  const [activeView, setActiveView] = useState('dashboard');

  function renderView() {
    switch (activeView) {
      case 'dashboard': return <AdminDashboard />;
      case 'heatmap': return <AttendanceHeatmap />;
      case 'students': return <AdminDashboard />;
      case 'user-management': return <SystemAdminPortal />;
      case 'schedule': return <Schedule />;
      default: return <AdminDashboard />;
    }
  }

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
}

// ── App ──────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute role="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
