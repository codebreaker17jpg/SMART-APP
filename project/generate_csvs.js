import fs from 'fs';
import crypto from 'crypto';

const faculties = [
    { id: "e75ae29a-6483-4cee-a8e9-39fdece39ea9", name: "Dr. Vikas Khanna" },
    { id: "bd208519-d0b8-4ebb-ab62-4d92ce8c6be4", name: "Prof. Rajni Malhotra" },
    { id: "b4e9aba1-3f01-43a5-ba18-1dae8b34b951", name: "Dr. Harpreet Sood" },
    { id: "baaf7f52-bf12-43f1-97e9-0f6096b242e9", name: "Prof. Amit Sethi" },
    { id: "b8f879db-739f-4737-b272-5a155b81c954", name: "Dr. Simranjit Ahluwalia" }
];

// 1. Generate Subjects
const subjectsData = [
    { name: "Punjabi (Compulsory)", code: "PBI101", dept: "Languages" },
    { name: "General English", code: "ENG101", dept: "Languages" },
    { name: "Mathematics", code: "MATH101", dept: "Science" },
    { name: "Physics", code: "PHY101", dept: "Science" },
    { name: "Chemistry", code: "CHEM101", dept: "Science" },
    { name: "Biology", code: "BIO101", dept: "Science" },
    { name: "History of Punjab", code: "HIST101", dept: "Humanities" },
    { name: "Political Science", code: "POL101", dept: "Humanities" },
    { name: "Computer Science", code: "CS101", dept: "Technology" },
    { name: "Physical Education", code: "PE101", dept: "Sports" }
];

const subjects = [];
subjectsData.forEach((s, index) => {
    subjects.push({
        id: crypto.randomUUID(),
        name: s.name,
        code: s.code,
        department: s.dept,
        semester: 1, // Let's put them all in semester 1
        teacher_id: faculties[index % faculties.length].id,
        total_classes: 40,
        created_at: new Date().toISOString()
    });
});

// CSV format helper
const toCsv = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(field => JSON.stringify(row[field] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

fs.writeFileSync('subjects.csv', toCsv(subjects));

// 2. Generate Class Schedules
const class_schedule = [];
const times = [
    { start: "09:00", end: "09:45" },
    { start: "09:45", end: "10:30" },
    { start: "10:45", end: "11:30" },
    { start: "11:30", end: "12:15" },
    { start: "13:00", end: "13:45" }
];

subjects.forEach((subj, index) => {
    // Give each subject 2 or 3 classes a week
    const days = [(index % 5) + 1, ((index + 2) % 5) + 1];
    const time = times[index % times.length];

    days.forEach(day => {
        class_schedule.push({
            id: crypto.randomUUID(),
            subject_id: subj.id,
            day_of_week: day,
            start_time: time.start + ':00',
            end_time: time.end + ':00',
            room_number: `Room ${101 + index}`,
            created_at: new Date().toISOString()
        });
    });
});

fs.writeFileSync('class_schedule.csv', toCsv(class_schedule));

// 3. Generate Curriculum Topics
const curriculum_topics = [];
const topicTemplates = [
    "Introduction to the Subject",
    "Fundamental Concepts",
    "Core Principles and Theories",
    "Practical Applications",
    "Advanced Analysis",
    "Case Studies and Examples",
    "Revision and Summary",
    "Final Assessment Prep"
];

subjects.forEach((subj) => {
    // 5 to 8 topics
    const numTopics = 5 + (Math.floor(Math.random() * 4));
    for (let i = 0; i < numTopics; i++) {
        curriculum_topics.push({
            id: crypto.randomUUID(),
            subject_id: subj.id,
            title: `${subj.name} - ${topicTemplates[i]}`,
            description: `Comprehensive coverage of ${topicTemplates[i]} as per PSEB guidelines for ${subj.name}.`,
            order_number: i + 1,
            estimated_hours: 2,
            status: i < 2 ? 'completed' : (i === 2 ? 'in_progress' : 'pending'),
            completed_at: i < 2 ? new Date(Date.now() - (1000 * 60 * 60 * 24 * (10 - i))).toISOString() : null,
            created_at: new Date().toISOString()
        });
    }
});

fs.writeFileSync('curriculum_topics.csv', toCsv(curriculum_topics));

// 4. Generate Achievements
const achievements = [
    {
        id: crypto.randomUUID(),
        name: "Perfect Attendance",
        description: "Attended all classes for a month continuously without any absence.",
        icon: "Trophy",
        criteria: "100_percent_attendance_30_days",
        created_at: new Date().toISOString()
    },
    {
        id: crypto.randomUUID(),
        name: "Topper of the Month",
        description: "Achieved the highest scores in monthly assessments.",
        icon: "Star",
        criteria: "highest_score_monthly",
        created_at: new Date().toISOString()
    },
    {
        id: crypto.randomUUID(),
        name: "Curriculum Champion",
        description: "Completed all curriculum topics ahead of schedule.",
        icon: "BookOpen",
        criteria: "early_curriculum_completion",
        created_at: new Date().toISOString()
    },
    {
        id: crypto.randomUUID(),
        name: "Star Participant",
        description: "Highly active and engaging during live class sessions.",
        icon: "Flame",
        criteria: "active_participation",
        created_at: new Date().toISOString()
    },
    {
        id: crypto.randomUUID(),
        name: "PSEB Scholar",
        description: "Demonstrated exceptional understanding of the Punjab Board curriculum.",
        icon: "Award",
        criteria: "scholastic_excellence",
        created_at: new Date().toISOString()
    }
];

fs.writeFileSync('achievements.csv', toCsv(achievements));

console.log('CSVs generated successfully!');
