const fs = require('fs');
const supabaseUrl = 'https://vythsbsbpagymsabysfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dGhzYnNicGFneW1zYWJ5c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDMyODgsImV4cCI6MjA4Njg3OTI4OH0.owqAD4R046xJcKBVGMjsdO_RkRk2iR6_APSk6XUVsJ8';

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
    fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
}

fetchRecords();
