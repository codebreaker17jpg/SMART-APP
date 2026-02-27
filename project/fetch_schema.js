const supabaseUrl = 'https://vythsbsbpagymsabysfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dGhzYnNicGFneW1zYWJ5c2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDMyODgsImV4cCI6MjA4Njg3OTI4OH0.owqAD4R046xJcKBVGMjsdO_RkRk2iR6_APSk6XUVsJ8';

async function fetchSchema() {
    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    try {
        console.log('--- Students ---');
        const res1 = await fetch(`${supabaseUrl}/rest/v1/students?select=*&limit=1`, { headers });
        console.log(await res1.json());

        console.log('\n--- Faculties ---');
        const res2 = await fetch(`${supabaseUrl}/rest/v1/faculties?select=*&limit=1`, { headers });
        console.log(await res2.json());
    } catch (err) {
        console.error(err);
    }
}

fetchSchema();
