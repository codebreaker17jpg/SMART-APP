/**
 * backfill_auth.mjs  (v2 – fixed UUID handling)
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 1 – Cleanup: deletes any auth users whose email matches a student or
 *           teacher but whose UUID does NOT match the public-table row (i.e.
 *           the broken entries from the previous run).
 * PHASE 2 – Backfill: creates auth users using the EXISTING UUID from the
 *           students / faculties table so auth.users.id == public table id.
 *
 * Students → email derived from roll number: PUN-004 → student.pun004@college.edu
 * Teachers → email already stored in the faculties table
 * Password → Smart@1234  (for every backfilled user)
 *
 * Usage:  node backfill_auth.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://ldjezkuwpstlyhegmnau.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUwNjQ2MCwiZXhwIjoyMDg3MDgyNDYwfQ.Z6G-I4zlSHVOX4OWcULb226xx6HWJidz6XawCWemGrc';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamV6a3V3cHN0bHloZWdtbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDY0NjAsImV4cCI6MjA4NzA4MjQ2MH0.v2hJ3cqlmPTyoYplrCuPsyo333SsvzQru0ol2uQRjRM';
const DEFAULT_PASSWORD = 'Smart@1234';

// ── Clients ───────────────────────────────────────────────────────────────────
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function rollToEmail(roll) {
    return `student.${roll.toLowerCase().replace('-', '')}@college.edu`;
}

/**
 * Creates an auth user using the EXISTING uuid from the public table.
 * Passing `id` explicitly ensures auth.users.id == students/faculties.id.
 */
async function createAuthUser(uuid, email, name, role) {
    try {
        const { error } = await admin.auth.admin.createUser({
            id: uuid,               // ← use existing UUID, no mismatch
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { name, role },
        });

        if (error) {
            if (
                error.message?.includes('already been registered') ||
                error.message?.includes('already exists') ||
                error.message?.includes('User already registered') ||
                error.status === 422
            ) {
                return { email, status: '⏭  Skipped (already exists)' };
            }
            return { email, status: `❌ Error: ${error.message}` };
        }

        return { email, status: '✅ Created' };
    } catch (err) {
        return { email, status: `❌ Exception: ${err.message}` };
    }
}

/**
 * Deletes an auth user by email if their auth UUID does NOT match the
 * expected public-table UUID (cleanup for the previous broken run).
 */
async function cleanupMismatchedAuthUser(expectedUuid, email) {
    try {
        // List all auth users and find by email
        const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (error) return;

        const authUser = data.users.find(u => u.email === email);
        if (!authUser) return; // not created yet, nothing to clean

        if (authUser.id !== expectedUuid) {
            // This is a mismatched auth user — delete it so we can recreate with correct UUID
            await admin.auth.admin.deleteUser(authUser.id);
            console.log(`  🗑  Cleaned stale auth user for ${email} (old UUID: ${authUser.id})`);
        }
    } catch (err) {
        // Non-fatal
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('   SMART APP – Auth Backfill Script (v2)');
    console.log('═══════════════════════════════════════════════\n');

    // ── 1. Fetch all students & teachers ──────────────────────────────────────
    console.log('📚 Fetching students...');
    const { data: students, error: sErr } = await db
        .from('students').select('id, name, roll_number, email');
    if (sErr) { console.error('Failed to fetch students:', sErr.message); process.exit(1); }
    console.log(`   Found ${students.length} students.\n`);

    console.log('👨‍🏫 Fetching teachers...');
    const { data: faculties, error: fErr } = await db
        .from('faculties').select('id, name, email');
    if (fErr) { console.error('Failed to fetch faculties:', fErr.message); process.exit(1); }
    console.log(`   Found ${faculties.length} teachers.\n`);

    // ── 2. Cleanup mismatched auth users from previous run ────────────────────
    console.log('🧹 Phase 1: Cleaning up any stale/mismatched auth users...\n');
    for (const student of students) {
        const email = student.email || rollToEmail(student.roll_number);
        await cleanupMismatchedAuthUser(student.id, email);
    }
    for (const teacher of faculties) {
        if (teacher.email) await cleanupMismatchedAuthUser(teacher.id, teacher.email);
    }
    console.log('   Cleanup done.\n');

    // ── 3. Create auth users with correct UUIDs ───────────────────────────────
    console.log('� Phase 2: Creating auth accounts...\n');

    for (const student of students) {
        const email = student.email || rollToEmail(student.roll_number);
        const result = await createAuthUser(student.id, email, student.name, 'student');
        console.log(`  [Student] ${student.name.padEnd(30)} ${result.status}`);
    }

    console.log('');

    for (const teacher of faculties) {
        if (!teacher.email) {
            console.log(`  [Teacher] ${teacher.name.padEnd(30)} ⚠  No email – skipped`);
            continue;
        }
        const result = await createAuthUser(teacher.id, teacher.email, teacher.name, 'teacher');
        console.log(`  [Teacher] ${teacher.name.padEnd(30)} ${result.status}`);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ Backfill complete!');
    console.log(`   Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('\n   Student login format:');
    console.log('   Email:    student.pun001@college.edu  (replace 001 with roll number)');
    console.log('   Password: Smart@1234');
    console.log('\n   Teacher login: use their email from the faculties table + Smart@1234');
    console.log('═══════════════════════════════════════════════\n');
}

main();
