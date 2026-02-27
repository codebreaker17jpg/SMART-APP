import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log("Checking students schema...");
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) {
        console.error('API Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns available in response:', Object.keys(data[0]));
    } else {
        console.log('No data found, but request succeeded.');
    }
}
checkSchema();
