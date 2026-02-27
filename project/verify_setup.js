const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';

async function verifyTables() {
    const tables = [
        'students', 'faculties', 'admins',
        'subjects', 'class_schedule', 'attendance_records',
        'curriculum_topics', 'live_sessions', 'achievements', 'student_achievements'
    ];

    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    for (const table of tables) {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
            if (res.ok) {
                console.log(`✅ Table '${table}' exists.`);
            } else {
                const error = await res.json();
                console.log(`❌ Table '${table}' check failed: ${error.message || res.statusText}`);
            }
        } catch (err) {
            console.log(`❌ Table '${table}' fetch error: ${err.message}`);
        }
    }
}

verifyTables();
