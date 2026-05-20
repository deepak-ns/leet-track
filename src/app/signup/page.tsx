"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { syncProfile } from "@/features/auth/services/profile-sync.service";
import { checkLeetCodeUserExists } from "@/features/leetcode/client";
import { supabase } from "@/shared/lib/supabase/client";

type SignupFormState = {
  name: string;
  email: string;
  password: string;
  leetcodeUsername: string;
  dailyTarget: string;
};

const initialState: SignupFormState = {
  name: "",
  email: "",
  password: "",
  leetcodeUsername: "",
  dailyTarget: "",
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const target = Number.parseInt(form.dailyTarget, 10);
    if (!Number.isFinite(target) || target <= 0) {
      setErrorMessage("Daily target must be a positive number.");
      setLoading(false);
      return;
    }

    // Validate LeetCode username
    const userExists = await checkLeetCodeUserExists(form.leetcodeUsername);
    if (!userExists) {
      setErrorMessage(
        "LeetCode username does not exist. Please enter a valid username.",
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          leetcode_username: form.leetcodeUsername,
          daily_target: target,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    const hasSession = Boolean(data.session);
    if (userId && hasSession) {
      try {
        await syncProfile({
          id: userId,
          name: form.name,
          leetcodeUsername: form.leetcodeUsername,
          dailyTarget: target,
        });
      } catch (profileError) {
        const blocked =
          profileError instanceof Error &&
          (profileError.message.toLowerCase().includes("row-level security") ||
            profileError.message.toLowerCase().includes("permission denied"));
        if (!blocked) {
          setErrorMessage(
            `Account created, but profile setup failed: ${profileError instanceof Error ? profileError.message : "Unknown error."}`,
          );
          setLoading(false);
          return;
        }
      }
    }

    setSuccessMessage("Account created! You can now log in.");
    setForm(initialState);
    setLoading(false);
  }

  const field = (
    id: keyof SignupFormState,
    label: string,
    type: string,
    placeholder: string,
    autocompleteVal: string,
    extra?: Record<string, unknown>,
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autocompleteVal}
        spellCheck={id === "email" || id === "leetcodeUsername" ? false : undefined}
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className="field-input w-full rounded-2xl px-4 py-3.5 text-sm"
        placeholder={placeholder}
        {...extra}
      />
    </div>
  );

  return (
    <div className="saas-shell flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        
        {/* Left Column: Build Habits Details */}
        <section className="surface-panel hidden rounded-[2.5rem] p-8 lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-teal-400" />
          <div>
            <span className="eyebrow">Build The Habit</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Create a practice system you can actually keep.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Set your daily target once, connect your LeetCode username, and let
              the dashboard keep score on solved problems, daily targets, and
              active days.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/50 bg-white/40 dark:border-slate-800/20 dark:bg-slate-900/10 p-6 backdrop-blur-sm transition hover:border-slate-300 dark:hover:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Personal pace
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                Start with a sustainable daily target and adjust later without
                losing context.
              </p>
            </div>
            
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl transition hover:bg-slate-900">
              <p className="text-sm font-semibold text-white">Clear signals</p>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                Know whether you are ahead, on track, or carrying work into
                tomorrow.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Signup Form Card */}
        <section className="glass-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-6 text-center lg:text-left">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-sm font-mono font-bold text-white shadow-md">
              LT
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Start tracking your LeetCode progress every day.
            </p>
          </div>

          <div className="surface-panel rounded-3xl p-5 sm:p-6 border border-slate-200/50 dark:border-slate-800/40">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {field("name", "Full Name", "text", "Jane Doe", "name")}
              {field("email", "Email Address", "email", "you@example.com", "email")}
              {field(
                "password",
                "Password",
                "password",
                "At least 6 characters",
                "new-password",
                {
                  minLength: 6,
                },
              )}
              {field(
                "leetcodeUsername",
                "LeetCode Username",
                "text",
                "leetcode_handle",
                "off",
              )}

              <div>
                <label
                  htmlFor="dailyTarget"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Daily Target
                </label>
                <div className="relative">
                  <input
                    id="dailyTarget"
                    name="dailyTarget"
                    type="number"
                    autoComplete="off"
                    required
                    min={1}
                    value={form.dailyTarget}
                    onChange={(e) =>
                      setForm({ ...form, dailyTarget: e.target.value })
                    }
                    className="field-input w-full rounded-2xl px-4 py-3.5 pr-28 text-sm"
                    placeholder="3"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    problems/day
                  </span>
                </div>
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
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-sky-600 dark:text-sky-400 transition hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
