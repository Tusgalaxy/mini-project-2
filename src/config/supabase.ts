import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jseqmoorwqhrgadzlgep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZXFtb29yd3FocmdhZHpsZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDQ3OTQsImV4cCI6MjEwNjcyMDc5NH0.ef5_YAQDkDET4kWrJ1RsUF3llr1Wdd6viZmEJsY5LSs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});