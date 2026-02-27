const supabaseUrl = 'https://vythsbsbpagymsabysfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dGhzYnNicGFneW1zYWJ5c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDMyODgsImV4cCI6MjA4Njg3OTI4OH0.owqAD4R046xJcKBVGMjsdO_RkRk2iR6_APSk6XUVsJ8';

async function fetchSchema() {
    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    const tables = ['students', 'faculties', 'subjects', 'attendance_records', 'curriculum_topics'];

    for (const table of tables) {
        try {
            console.log(`\n--- ${table} ---`);
            const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
            const data = await res.json();
            if (data.length > 0) {
                console.log(Object.keys(data[0]));
            } else {
                console.log('No data, fetching empty schema might require different query. Let us try to get columns via postgrest if possible, or just look at data:', data);
            }
        } catch (err) {
            console.error(`Error fetching ${table}:`, err);
        }
    }
}

fetchSchema();
