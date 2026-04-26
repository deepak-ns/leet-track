"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

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
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: typeof metadata.name === "string" ? metadata.name : null,
          leetcode_username: typeof metadata.leetcode_username === "string" ? metadata.leetcode_username : null,
        },
        { onConflict: "id" },
      );
      if (profileError) {
        setErrorMessage(`Logged in, but profile sync failed: ${profileError.message}`);
        setLoading(false);
        return;
      }
    }

    setSuccessMessage("Logged in successfully. Redirecting…");
    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand mark */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-md shadow-blue-200">
            ⚡
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Log in to continue tracking your progress.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your password"
              />
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
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 transition hover:text-blue-500">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}