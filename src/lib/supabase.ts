import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = "https://xxhresiqpggsbkbrened.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aHJlc2lxcGdnc2JrYnJlbmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzE3MjYsImV4cCI6MjA4NTUwNzcyNn0.GTd8opWWRBP_TQQNTpzHp7vMkDKqXLY_xDQu7I38qLc";

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!isConfigured && typeof window !== "undefined") {
  console.warn(
    "Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

export const isSupabaseConfigured = isConfigured;

export type { Database };
