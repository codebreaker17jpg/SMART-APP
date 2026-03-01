import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Role resolution ──────────────────────────────────────────────────

  async function resolveRole(userId: string, userEmail: string): Promise<Profile | null> {
    try {
      // 1. Check admins
      const { data: admin, error: adminErr } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (adminErr) console.warn('admins query error:', adminErr.message);

      if (admin) {
        return {
          id: admin.id,
          name: admin.name || 'Admin',
          email: admin.email || userEmail,
          role: 'admin',
          department: 'Administration',
          created_at: admin.created_at,
        };
      }

      // 2. Check faculties
      const { data: faculty, error: facErr } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (facErr) console.warn('faculties query error:', facErr.message);

      if (faculty) {
        return {
          id: faculty.id,
          name: faculty.name || 'Teacher',
          email: faculty.email || userEmail,
          role: 'teacher',
          department: faculty.department || 'General',
          created_at: faculty.created_at,
        };
      }

      // 3. Check students
      const { data: student, error: stuErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (stuErr) console.warn('students query error:', stuErr.message);

      if (student) {
        return {
          id: student.id,
          name: student.name || 'Student',
          email: userEmail,
          role: 'student',
          department: student.subject_major || 'General',
          semester: 1,
          face_descriptor: student.face_descriptor,
          created_at: student.created_at,
        };
      }
    } catch (err) {
      console.error('resolveRole error:', err);
    }

    // No matching profile in any table
    return null;
  }

  // ── Session bootstrap ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !cancelled) {
          const profile = await resolveRole(session.user.id, session.user.email || '');
          if (!cancelled) setCurrentUser(profile);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();

    // Listen for auth state changes (logout, token refresh)
    // NOTE: SIGNED_IN is handled directly in signIn() to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── Auth methods ─────────────────────────────────────────────────────

  async function signIn(email: string, password: string): Promise<{ error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Authentication failed. Please try again.' };
      }

      // Resolve role immediately (don't rely on async onAuthStateChange)
      const profile = await resolveRole(data.user.id, data.user.email || '');

      if (!profile) {
        // Auth succeeded but no profile row found — sign them out
        await supabase.auth.signOut();
        return { error: 'No profile found for this account. Contact your administrator.' };
      }

      setCurrentUser(profile);
      return {};
    } catch (err) {
      console.error('signIn error:', err);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error:', err);
    } finally {
      setCurrentUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
