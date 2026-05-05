import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const originalErrorLog = console.error;
console.error = function (...args: unknown[]) {
  const errorMessage = String(args[0]);
  if (
    errorMessage?.includes("Invalid Refresh Token") ||
    errorMessage?.includes("Refresh Token Not Found")
  ) {
    return;
  }
  originalErrorLog.apply(console, args as Parameters<typeof originalErrorLog>);
};
