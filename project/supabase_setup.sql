-- ==========================================
-- SUPABASE SCHEMA FOR EDUTRACK SMART CAMPUS
-- Execute this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create 'subjects' table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    department TEXT NOT NULL,
    semester INTEGER NOT NULL,
    teacher_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
    total_classes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'class_schedule' table
CREATE TABLE IF NOT EXISTS public.class_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday...7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create 'attendance_records' table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    marked_by UUID, -- Could reference faculties or admins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create 'curriculum_topics' table
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_number INTEGER NOT NULL,
    estimated_hours INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending' NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create 'live_sessions' table (For QR Scanner)
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create 'achievements' table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create 'student_achievements' table
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS) & ADD POLICIES
-- ==========================================
-- This allows the frontend strictly query the tables

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to subjects" ON public.subjects FOR SELECT USING (true);

ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to class_schedule" ON public.class_schedule FOR SELECT USING (true);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (true);

ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to curriculum_topics" ON public.curriculum_topics FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update access to curriculum_topics" ON public.curriculum_topics FOR UPDATE USING (true);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to live_sessions" ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to live_sessions" ON public.live_sessions FOR INSERT WITH CHECK (true);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to achievements" ON public.achievements FOR SELECT USING (true);

ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access to student_achievements" ON public.student_achievements FOR SELECT USING (true);

-- ==========================================
-- DONE!
-- ==========================================
