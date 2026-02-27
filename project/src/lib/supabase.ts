import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  semester?: number;
  face_descriptor?: number[];
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  teacher_id: string;
  total_classes: number;
  created_at: string;
};

export type ClassSchedule = {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  subject_id: string;
  class_date: string;
  status: 'present' | 'absent' | 'late';
  marked_at: string;
  marked_by: string;
  created_at: string;
};

export type CurriculumTopic = {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  order_number: number;
  estimated_hours: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  created_at: string;
};

export type StudentAchievement = {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_at: string;
};
