import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    const output = {};

    const { data: topics } = await supabase.from('curriculum_topics').select('status');
    output.topicStatuses = Array.from(new Set(topics?.map(t => t.status)));

    const { data: attendance } = await supabase.from('attendance_records').select('status');
    output.attStatuses = Array.from(new Set(attendance?.map(a => a.status)));

    fs.writeFileSync('status_output.json', JSON.stringify(output, null, 2));
}

testFetch();
