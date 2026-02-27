import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    const output = {};

    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    output.studentCount = studentCount;

    const { count: facultyCount } = await supabase.from('faculties').select('*', { count: 'exact', head: true });
    output.facultyCount = facultyCount;

    const { data: subjects } = await supabase.from('subjects').select('*');
    output.subjectsLength = subjects?.length;

    const { data: attendance } = await supabase.from('attendance_records').select('*');
    output.attendanceLength = attendance?.length;
    if (attendance && attendance.length > 0) {
        output.attendanceSample = attendance[0];
    }

    const { data } = await supabase
        .from('subjects')
        .select('*, curriculum_topics(*)');
    output.subjectsWithTopics = data?.map(d => ({ name: d.name, topicsLength: d.curriculum_topics?.length }));

    fs.writeFileSync('results_debug.json', JSON.stringify(output, null, 2));
}

testFetch();
