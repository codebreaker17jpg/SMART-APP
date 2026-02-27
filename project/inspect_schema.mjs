import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vythsbsbpagymsabysfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dGhzYnNicGFneW1zYWJ5c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDMyODgsImV4cCI6MjA4Njg3OTI4OH0.owqAD4R046xJcKBVGMjsdO_RkRk2iR6_APSk6XUVsJ8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('--- Students ---');
    const { data: students, error: err1 } = await supabase.from('students').select('*').limit(1);
    if (err1) console.error(err1);
    else console.log(students);

    console.log('\n--- Faculties ---');
    const { data: faculties, error: err2 } = await supabase.from('faculties').select('*').limit(1);
    if (err2) console.error(err2);
    else console.log(faculties);
}

inspect();
