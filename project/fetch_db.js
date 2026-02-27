const fs = require('fs');
const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';

async function fetchRecords() {
    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    const tables = ['attendance_records', 'curriculum_topics', 'subjects', 'students', 'faculties'];
    const results = {};

    for (const table of tables) {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
            const data = await res.json();
            results[table] = data;
        } catch (err) {
            results[table] = { error: err.message };
        }
    }
    fs.writeFileSync('db_output.json', JSON.stringify(results, null, 2));
}

fetchRecords();
