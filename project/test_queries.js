import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log("Testing AdminDashboard loads...");
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    console.log("Students count:", studentCount);

    const { count: facultyCount } = await supabase.from('faculties').select('*', { count: 'exact', head: true });
    console.log("Faculties count:", facultyCount);

    const { data: subjects } = await supabase.from('subjects').select('*');
    console.log("Subjects length:", subjects?.length);

    const { data: attendance } = await supabase.from('attendance_records').select('*');
    console.log("Attendance length:", attendance?.length);
    if (attendance && attendance.length > 0) {
        console.log("Sample attendance item:", attendance[0]);
    }

    console.log("Testing CurriculumManager loads...");
    const { data } = await supabase
        .from('subjects')
        .select('*, curriculum_topics(*)');
    console.log("Subjects with topics:");
    if (data && data.length > 0) {
        data.forEach(d => {
            console.log(`Subject ${d.name} (${d.id}) topics length:`, d.curriculum_topics?.length, d.curriculum_topics);
        });
    } else {
        console.log("No subjects or data is null");
        console.log("Data:", data);
    }
}

testFetch();
