const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';

const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
};

async function fetchIds() {
    try {
        const facRes = await fetch(`${supabaseUrl}/rest/v1/faculties?select=id,name&limit=10`, { headers });
        const faculties = await facRes.json();

        const stuRes = await fetch(`${supabaseUrl}/rest/v1/students?select=id,name&limit=10`, { headers });
        const students = await stuRes.json();

        console.log(JSON.stringify({ faculties, students }, null, 2));
    } catch (err) {
        console.error(err);
    }
}

fetchIds();
