-- ==========================================
-- MIGRATION: Face Recognition Attendance
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add verification_method column to attendance_records
-- Values: 'manual' (default), 'qr', 'face'
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'manual';

-- Add session_id to link attendance to a live_session
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.live_sessions(id);

-- ==========================================
-- DONE!
-- ==========================================
