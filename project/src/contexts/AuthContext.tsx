import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  allUsers: Profile[];
  switchUser: (userId: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');

      const { data: facultiesData, error: facultiesError } = await supabase
        .from('faculties')
        .select('*');

      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('*');

      if (studentsError) console.error('Error loading students:', studentsError);
      if (facultiesError) console.error('Error loading faculties:', facultiesError);
      if (adminsError) console.error('Error loading admins:', adminsError);

      const students: Profile[] = (studentsData || []).map((s: any) => ({
        id: s.id,
        name: s.name || s.full_name || 'Unknown Student',
        role: 'student',
        department: s.department || 'General',
        semester: s.semester || 1,
        face_descriptor: s.face_descriptor,
        created_at: s.created_at || new Date().toISOString()
      }));

      const faculties: Profile[] = (facultiesData || []).map((f: any) => ({
        id: f.id,
        name: f.name || f.full_name || 'Unknown Faculty',
        role: 'teacher',
        department: f.department || 'General',
        created_at: f.created_at || new Date().toISOString()
      }));

      const admins: Profile[] = (adminsData || []).map((a: any) => ({
        id: a.id,
        name: a.name || a.full_name || 'Admin',
        role: 'admin',
        department: 'Administration',
        created_at: a.created_at || new Date().toISOString()
      }));

      const allData = [...faculties, ...students, ...admins];

      setAllUsers(allData);
      if (allData.length > 0) {
        const studentUser = allData.find(u => u.role === 'student');
        setCurrentUser(studentUser || allData[0]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  function switchUser(userId: string) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, allUsers, switchUser, loading }}>
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
