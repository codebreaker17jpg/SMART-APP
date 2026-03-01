import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    role: 'admin' | 'teacher' | 'student';
}

const roleRedirectMap = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
};

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Loading EduTrack...</p>
                </div>
            </div>
        );
    }

    // Not authenticated — go to login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated but wrong role — redirect to their correct dashboard
    if (currentUser.role !== role) {
        return <Navigate to={roleRedirectMap[currentUser.role]} replace />;
    }

    return <>{children}</>;
}
