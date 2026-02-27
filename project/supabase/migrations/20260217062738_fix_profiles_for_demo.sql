/*
  # Fix Profiles Table for Demo Mode

  1. Changes
    - Drop foreign key constraint from profiles to auth.users
    - Make profiles table work standalone for demo purposes
    
  2. Security
    - Update RLS policies to work without auth
    - Allow public read access for demo
*/

-- Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Update RLS policies for demo mode
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Update other tables' policies for demo mode
DROP POLICY IF EXISTS "Teachers can manage their subjects" ON subjects;
CREATE POLICY "Teachers can manage subjects"
  ON subjects FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can manage their class schedule" ON class_schedule;
CREATE POLICY "Teachers can manage class schedule"
  ON class_schedule FOR ALL
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Students can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Teachers can view their class attendance" ON attendance_records;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance_records;

CREATE POLICY "Anyone can view attendance"
  ON attendance_records FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can manage attendance"
  ON attendance_records FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can manage their curriculum" ON curriculum_topics;
CREATE POLICY "Anyone can manage curriculum"
  ON curriculum_topics FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can view own progress" ON topic_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON topic_progress;

CREATE POLICY "Anyone can view progress"
  ON topic_progress FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can update progress"
  ON topic_progress FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can view own achievements" ON student_achievements;
CREATE POLICY "Anyone can view student achievements"
  ON student_achievements FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage their sessions" ON live_sessions;
CREATE POLICY "Anyone can manage sessions"
  ON live_sessions FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);