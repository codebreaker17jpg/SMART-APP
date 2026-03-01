import { createClient } from '@supabase/supabase-js';

// Uses the correct active Supabase project
const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('=== STUDENTS (first 3 rows) ===');
    const { data: students, error: err1 } = await supabase.from('students').select('*').limit(3);
    if (err1) console.error('Error:', err1.message);
    else {
        console.log('Columns:', Object.keys(students[0] || {}).join(', '));
        console.log(JSON.stringify(students, null, 2));
    }

    console.log('\n=== FACULTIES (first 3 rows) ===');
    const { data: faculties, error: err2 } = await supabase.from('faculties').select('*').limit(3);
    if (err2) console.error('Error:', err2.message);
    else {
        console.log('Columns:', Object.keys(faculties[0] || {}).join(', '));
        console.log(JSON.stringify(faculties, null, 2));
    }
}

inspect();
