"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { syncProfileFromUserMetadata } from "@/features/auth/services/profile-sync.service";
import { supabase } from "@/shared/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user) {
      try {
        await syncProfileFromUserMetadata(user);
      } catch (profileError) {
        setErrorMessage(
          `Logged in, but profile sync failed: ${profileError instanceof Error ? profileError.message : "Unknown error."}`,
        );
        setLoading(false);
        return;
      }
    }

    setSuccessMessage("Logged in successfully. Redirecting…");
    router.push("/home");
    setLoading(false);
  }

  return (
    <div className="saas-shell flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        
        {/* Left Column: Context Card */}
        <section className="surface-panel hidden rounded-[2.5rem] p-8 lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-teal-400" />
          <div>
            <span className="eyebrow">Welcome Back</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Pick up where you left off.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Review today&apos;s accepted problems, track your daily target,
              and stay aligned with your goals without digging through clutter.
            </p>
          </div>

          <div className="mt-10">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl">
              <p className="font-mono text-xs tracking-wider text-slate-400">Accountability Snapshot</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-slate-800/80 bg-white/5 p-4 transition hover:bg-white/8">
                  <p className="font-mono text-3xl font-extrabold text-white">5</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">Target</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-white/5 p-4 transition hover:bg-white/8">
                  <p className="font-mono text-3xl font-extrabold text-white">12</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">Active Days</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-white/5 p-4 transition hover:bg-white/8">
                  <p className="font-mono text-3xl font-extrabold text-white">2</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">Solved</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Login Card */}
        <section className="glass-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-6 text-center lg:text-left">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-sm font-mono font-bold text-white shadow-md">
              LT
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Sign in
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Log in to continue tracking your progress.
            </p>
          </div>

          <div className="surface-panel rounded-3xl p-5 sm:p-6 border border-slate-200/50 dark:border-slate-800/40">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input w-full rounded-2xl px-4 py-3.5 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input w-full rounded-2xl px-4 py-3.5 text-sm"
                  placeholder="Enter your password"
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                  <span className="font-bold text-sm text-red-500 dark:text-red-400 font-mono">!</span>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-5">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
                  <span className="font-bold text-sm text-emerald-500 dark:text-emerald-400 font-mono">OK</span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-5">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="gradient-button w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 focus-visible:outline-none dark:focus-visible:ring-offset-slate-950"
              >
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            New here?{" "}
            <Link
              href="/signup"
              className="font-bold text-sky-600 dark:text-sky-400 transition hover:underline"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
