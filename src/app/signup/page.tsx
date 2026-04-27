"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

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
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          name: form.name,
          leetcode_username: form.leetcodeUsername,
          daily_target: target,
        },
        { onConflict: "id" },
      );
      if (profileError) {
        const blocked =
          profileError.message.toLowerCase().includes("row-level security") ||
          profileError.message.toLowerCase().includes("permission denied");
        if (!blocked) {
          setErrorMessage(
            `Account created, but profile setup failed: ${profileError.message}`,
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
    extra?: Record<string, unknown>,
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className="field-input w-full rounded-2xl px-4 py-3 text-sm"
        placeholder={placeholder}
        {...extra}
      />
    </div>
  );

  return (
    <div className="saas-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <section className="surface-panel hidden rounded-[2rem] p-8 lg:block">
          <span className="eyebrow">Build The Habit</span>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
            Create a practice system you can actually keep.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            Set your daily target once, connect your LeetCode username, and let
            the dashboard keep score on solved problems, daily targets, and
            active days.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/75 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Personal pace
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Start with a sustainable daily target and adjust later without
                losing context.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-white">Clear signals</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Know whether you are ahead, on track, or carrying work into
                tomorrow.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 text-center lg:text-left">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-xl font-semibold text-white shadow-lg shadow-slate-900/15">
              LT
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Start tracking your LeetCode progress every day.
            </p>
          </div>

          <div className="surface-panel rounded-[1.5rem] p-5 sm:p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {field("name", "Full Name", "text", "Jane Doe")}
              {field("email", "Email", "email", "you@example.com")}
              {field(
                "password",
                "Password",
                "password",
                "At least 6 characters",
                {
                  minLength: 6,
                },
              )}
              {field(
                "leetcodeUsername",
                "LeetCode Username",
                "text",
                "leetcode_handle",
              )}

              <div>
                <label
                  htmlFor="dailyTarget"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Daily Target
                </label>
                <div className="relative">
                  <input
                    id="dailyTarget"
                    type="number"
                    required
                    min={1}
                    value={form.dailyTarget}
                    onChange={(e) =>
                      setForm({ ...form, dailyTarget: e.target.value })
                    }
                    className="field-input w-full rounded-2xl px-4 py-3 pr-30 text-sm"
                    placeholder="3"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    problems/day
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-3">
                  <span className="text-sm text-red-500">!</span>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <span className="text-sm font-semibold text-emerald-500">
                    OK
                  </span>
                  <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="gradient-button w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-sky-700 transition hover:text-sky-600"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
