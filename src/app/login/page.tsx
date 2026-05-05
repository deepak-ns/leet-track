"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { syncProfileFromUserMetadata } from "@/features/auth/services/profile-sync.service";
import { syncUserStats } from "@/features/dashboard/services/leetcode-sync.service";
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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

      try {
        await syncUserStats(user);
      } catch (syncError) {
        setErrorMessage(
          syncError instanceof Error
            ? `Logged in, but stats sync failed: ${syncError.message}`
            : "Logged in, but stats sync failed.",
        );
        setLoading(false);
        return;
      }
    }

    setSuccessMessage("Logged in successfully. Redirecting...");
    router.push("/home");
    setLoading(false);
  }

  return (
    <div className="saas-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-panel hidden rounded-[2rem] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="eyebrow">Welcome Back</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
              Pick up where you left off.
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Review today&apos;s accepted problems, track your daily target, and stay aligned
              with your goals without digging through clutter.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Accountability snapshot</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-2xl font-semibold">5</p>
                  <p className="mt-1 text-xs text-slate-400">target</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-2xl font-semibold">12</p>
                  <p className="mt-1 text-xs text-slate-400">active days</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-2xl font-semibold">2</p>
                  <p className="mt-1 text-xs text-slate-400">solved today</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 text-center lg:text-left">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-xl font-semibold text-white shadow-lg shadow-slate-900/15">
              LT
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Log in to continue tracking your progress.
            </p>
          </div>

          <div className="surface-panel rounded-[1.5rem] p-5 sm:p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="Enter your password"
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-3">
                  <span className="text-sm text-red-500">!</span>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <span className="text-sm font-semibold text-emerald-500">OK</span>
                  <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="gradient-button w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-sky-700 transition hover:text-sky-600">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
