// js/supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://xxxxxx.supabase.co";          // ← あなたの Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6..."; // ← anon public key

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);