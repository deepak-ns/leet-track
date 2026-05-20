"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/home");
        return;
      }
      setCheckingAuth(false);
    }

    checkSession();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="saas-shell min-h-screen flex items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-xs rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/20">
          <div className="mx-auto flex flex-col items-center gap-3">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
            <p className="text-sm font-medium text-slate-200">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-shell hero-grid flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="surface-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-blue-700" />
          <span className="eyebrow">LeetCode Track</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Turn daily practice into visible momentum.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Follow your progress, stay on target, and stay accountable with a
            workspace that feels more like a product dashboard than a
            spreadsheet.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="gradient-button inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition hover:opacity-95"
            >
              Start Tracking
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-2xl font-semibold text-slate-950">Daily</p>
              <p className="mt-1 text-sm text-slate-600">
                See what you solved today and what still needs attention.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-2xl font-semibold text-slate-950">Targets</p>
              <p className="mt-1 text-sm text-slate-600">
                Set a daily target and track the gap at a glance.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-2xl font-semibold text-slate-950">Friends</p>
              <p className="mt-1 text-sm text-slate-600">
                Compare progress with people who keep you honest and motivated.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card hover-lift rounded-[2rem] p-5 sm:p-6 lg:p-7">
          <div className="rounded-[1.6rem] border border-slate-200/70 bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>Today</span>
              <span>Live snapshot</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-sm text-slate-300">Solved today</p>
                <p className="mt-2 text-4xl font-semibold text-white">3</p>
                <p className="mt-2 text-sm text-emerald-300">Ahead of target</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-sm text-slate-300">Active days</p>
                <p className="mt-2 text-4xl font-semibold text-white">12/30</p>
                <p className="mt-2 text-sm text-sky-300">
                  Built one day at a time
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-teal-500/20 via-sky-500/20 to-blue-500/20 p-4">
              <p className="text-sm text-slate-200">What the app keeps clear</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Accepted problems solved today</li>
                <li>Daily targets and active days</li>
                <li>Friend standings in one view</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
