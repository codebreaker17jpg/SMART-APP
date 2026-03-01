-- ============================================================
-- MIGRATION: Add email column to students table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add the email column (nullable so it doesn't break existing rows immediately)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email for all existing students using their roll_number
--    Formula: PUN-004 → student.pun004@college.edu
UPDATE public.students
SET email = 'student.' || LOWER(REPLACE(roll_number, '-', '')) || '@college.edu'
WHERE email IS NULL AND roll_number IS NOT NULL AND roll_number != '';

-- 3. (Optional) Once all rows are populated you can enforce NOT NULL:
-- ALTER TABLE public.students ALTER COLUMN email SET NOT NULL;

-- ============================================================
-- VERIFICATION – run this to confirm:
-- SELECT id, name, roll_number, email FROM public.students LIMIT 10;
-- ============================================================
