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
        data: { name: form.name, leetcode_username: form.leetcodeUsername, daily_target: target },
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
        { id: userId, name: form.name, leetcode_username: form.leetcodeUsername },
        { onConflict: "id" },
      );
      if (profileError) {
        const blocked =
          profileError.message.toLowerCase().includes("row-level security") ||
          profileError.message.toLowerCase().includes("permission denied");
        if (!blocked) {
          setErrorMessage(`Account created, but profile setup failed: ${profileError.message}`);
          setLoading(false);
          return;
        }
      }
    }

    setSuccessMessage("Account created! Check your email to verify, then log in.");
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
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
        {...extra}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand mark */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-md shadow-blue-200">
            ⚡
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start tracking your LeetCode progress every day.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {field("name", "Full Name", "text", "Jane Doe")}
            {field("email", "Email", "email", "you@example.com")}
            {field("password", "Password", "password", "At least 6 characters", { minLength: 6 })}
            {field("leetcodeUsername", "LeetCode Username", "text", "leetcode_handle")}

            <div>
              <label htmlFor="dailyTarget" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Daily Target
              </label>
              <div className="relative">
                <input
                  id="dailyTarget"
                  type="number"
                  required
                  min={1}
                  value={form.dailyTarget}
                  onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="3"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  problems/day
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <span className="text-sm text-red-500">⚠</span>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                <span className="text-sm text-emerald-500">✓</span>
                <p className="text-sm text-emerald-700">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 transition hover:text-blue-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}