/*
  # EduTrack: Smart Curriculum & Attendance Schema

  1. New Tables
    - profiles: User profiles with roles (student/teacher/admin)
    - subjects: Course information
    - class_schedule: Weekly class timings
    - attendance_records: Student attendance tracking
    - curriculum_topics: Syllabus topics per subject
    - topic_progress: Student progress on topics
    - achievements: Available badges
    - student_achievements: Earned badges
    - live_sessions: Active QR attendance sessions

  2. Security
    - Enable RLS on all tables
    - Students can view their own data
    - Teachers can manage their class data
    - Admins have full access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  department text,
  semester integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  department text NOT NULL,
  semester integer NOT NULL,
  teacher_id uuid REFERENCES profiles(id),
  total_classes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage their subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Create class_schedule table
CREATE TABLE IF NOT EXISTS class_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule"
  ON class_schedule FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage their class schedule"
  ON class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = class_schedule.subject_id
      AND subjects.teacher_id = auth.uid()
    )
  );

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_at timestamptz DEFAULT now(),
  marked_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, class_date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their class attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = attendance_records.subject_id
      AND subjects.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can mark attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = attendance_records.subject_id
      AND subjects.teacher_id = auth.uid()
    )
  );

-- Create curriculum_topics table
CREATE TABLE IF NOT EXISTS curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_number integer NOT NULL,
  estimated_hours integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE curriculum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curriculum topics"
  ON curriculum_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage their curriculum"
  ON curriculum_topics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = curriculum_topics.subject_id
      AND subjects.teacher_id = auth.uid()
    )
  );

-- Create topic_progress table
CREATE TABLE IF NOT EXISTS topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, topic_id)
);

ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON topic_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON topic_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  criteria text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Create student_achievements table
CREATE TABLE IF NOT EXISTS student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own achievements"
  ON student_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Create live_sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qr_code text NOT NULL,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON live_sessions FOR SELECT
  TO authenticated
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Teachers can manage their sessions"
  ON live_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);