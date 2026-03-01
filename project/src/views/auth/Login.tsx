import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const roleRedirectMap: Record<string, string> = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
};

export function Login() {
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Access signIn separately so it doesn't trigger re-renders
    const auth = useAuth();

    // If already authenticated, redirect to the correct dashboard
    useEffect(() => {
        if (currentUser) {
            navigate(roleRedirectMap[currentUser.role] || '/login', { replace: true });
        }
    }, [currentUser, navigate]);

    // Show loading ONLY while checking existing session on first mount
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Loading EduTrack...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await auth.signIn(email, password);

            if (result.error) {
                setError(result.error);
                setLoading(false); // ← stop the spinner immediately on error
                return;
            }

            // Success — redirect handled by the useEffect above.
            // Safety net: stop spinning if redirect somehow takes too long.
            setTimeout(() => { setLoading(false); }, 3000);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">EduTrack</h1>
                    <p className="text-slate-400 mt-1">Smart Campus Attendance System</p>
                </div>

                {/* Login card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@university.edu"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>


                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all ${loading
                                ? 'bg-blue-500/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25'
                                }`}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-slate-500 text-center mt-6">
                        Accounts are provisioned by your administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
