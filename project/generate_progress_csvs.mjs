import fs from 'fs';
import crypto from 'crypto';

const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';

const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
};

// Helper to parse CSV
function parseCsv(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.replace(/^"/, '').replace(/"$/, '').trim());
        const obj = {};
        headers.forEach((h, j) => {
            obj[h] = row[j];
        });
        data.push(obj);
    }
    return data;
}

// Helper to write CSV
function toCsv(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(field => {
            let val = row[field];
            if (val === null || val === undefined) val = '';
            else val = String(val);
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

async function main() {
    try {
        console.log('Fetching students... (up to 70)');
        const stuRes = await fetch(`${supabaseUrl}/rest/v1/students?select=id&limit=70`, { headers });
        const students = await stuRes.json();

        if (!students || students.length === 0) {
            console.error('No students found in Supabase!');
            return;
        }

        console.log(`Found ${students.length} students.`);

        console.log('Fetching faculties... (for teacher_ids)');
        const facRes = await fetch(`${supabaseUrl}/rest/v1/faculties?select=id&limit=20`, { headers });
        const faculties = await facRes.json();
        const facultyIds = faculties.map(f => f.id);

        console.log('Reading local CSV files...');
        const subjectsText = fs.readFileSync('subjects.csv', 'utf-8');
        const subjects = parseCsv(subjectsText);

        const scheduleText = fs.readFileSync('class_schedule.csv', 'utf-8');
        const schedules = parseCsv(scheduleText);

        console.log('Generating Attendance Records for the last 21 days...');
        const attendance_records = [];

        // Map JS getDay() (0=Sun, 1=Mon ... 6=Sat) to Supabase check (1=Mon ... 7=Sun)
        function getSupabaseDayOfWeek(date) {
            const day = date.getDay(); // 0 is Sunday
            return day === 0 ? 7 : day;
        }

        const todayTimestamp = Date.now();
        // Today is 2026-02-27T01:45:19+05:30 based on user prompt, but we'll use system current time
        const ONE_DAY = 24 * 60 * 60 * 1000;

        for (let d = 20; d >= 0; d--) { // From 20 days ago up to today (21 days total)
            const currentDate = new Date(todayTimestamp - (d * ONE_DAY));
            const dayOfWeek = getSupabaseDayOfWeek(currentDate);
            const dateStr = currentDate.toISOString().split('T')[0];

            // Find schedules for this day
            const dailyClasses = schedules.filter(s => parseInt(s.day_of_week) === dayOfWeek);

            // For each class, for each student, generate attendance
            dailyClasses.forEach(cls => {
                const subject = subjects.find(s => s.id === cls.subject_id);
                // Assign a teacher id (either from subject or a random one)
                const teacherId = subject?.teacher_id || facultyIds[0];

                students.forEach(student => {
                    const rand = Math.random();
                    let status = 'present';
                    if (rand > 0.95) status = 'absent';
                    else if (rand > 0.88) status = 'late';

                    const classDateBaseTime = new Date(`${dateStr}T${cls.start_time}Z`); // UTC time roughly

                    // Marked at some time near the class start time
                    const markedAt = new Date(classDateBaseTime.getTime() + Math.random() * 10 * 60000).toISOString();

                    attendance_records.push({
                        id: crypto.randomUUID(),
                        student_id: student.id,
                        subject_id: cls.subject_id,
                        class_date: dateStr,
                        status: status,
                        marked_at: markedAt,
                        marked_by: teacherId,
                        created_at: markedAt
                    });
                });
            });
        }

        console.log(`Generated ${attendance_records.length} attendance records.`);
        fs.writeFileSync('attendance_records.csv', toCsv(attendance_records));

        console.log('Updating Curriculum Topics (30% completed)...');
        const topicsText = fs.readFileSync('curriculum_topics.csv', 'utf-8');
        const topics = parseCsv(topicsText);

        let completedCount = 0;
        const targetCompleted = Math.floor(topics.length * 0.3);

        // Randomly shuffle indices to pick 30%
        const indices = [...Array(topics.length).keys()];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const completedIndices = new Set(indices.slice(0, targetCompleted));

        const updatedTopics = topics.map((topic, index) => {
            if (completedIndices.has(index)) {
                return {
                    ...topic,
                    status: 'completed',
                    completed_at: new Date(todayTimestamp - Math.random() * 20 * ONE_DAY).toISOString()
                };
            } else {
                return {
                    ...topic,
                    status: 'pending',
                    completed_at: ''
                };
            }
        });

        fs.writeFileSync('curriculum_topics.csv', toCsv(updatedTopics));
        console.log(`Marked ${targetCompleted} topics as completed.`);

        console.log('CSVs generated successfully!');
    } catch (err) {
        console.error('Error generating data:', err);
    }
}

main();
