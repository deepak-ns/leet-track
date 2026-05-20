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
      <div className="saas-shell min-h-screen flex items-center justify-center px-6">
        <div className="relative max-w-xs rounded-3xl border border-slate-200/50 bg-white/70 dark:border-slate-800/50 dark:bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl transition-explicit-300">
          <div className="mx-auto flex flex-col items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-800 dark:border-t-sky-400" />
              <span className="font-mono text-xs font-bold text-sky-500 dark:text-sky-400">LT</span>
            </div>
            <p className="font-mono text-xs tracking-wider text-slate-500 dark:text-slate-400">Initializing session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-shell hero-grid flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        
        {/* Left Column: Hero & Core Intro */}
        <section className="surface-panel relative overflow-hidden rounded-[2.5rem] p-8 sm:p-10 lg:p-12">
          {/* Top subtle decorative strip */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-indigo-500" />
          
          <div className="flex flex-col items-start">
            <span className="eyebrow">LeetCode Track</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl text-wrap-balance">
              Turn daily practice into{" "}
              <span className="bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-teal-400 dark:to-indigo-400">
                visible momentum.
              </span>
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg text-wrap-pretty">
              Follow your progress, stay on target, and stay accountable with a
              workspace that feels more like a professional developer console than a
              spreadsheet.
            </p>

            <div className="mt-8 flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
              <Link
                href="/signup"
                className="gradient-button inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 focus-visible:outline-none dark:focus-visible:ring-offset-slate-950"
              >
                Start Tracking
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/50 px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 backdrop-blur-sm transition-all duration-200 hover:bg-white dark:hover:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 focus-visible:outline-none dark:focus-visible:ring-offset-slate-950"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Core Pillars */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/20 p-5 backdrop-blur-sm transition hover:border-slate-300/80 dark:hover:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-500" />
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Daily Pace</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Live Snapshots</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                See what you solved today and what still needs attention instantly.
              </p>
            </div>
            
            <div className="rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/20 p-5 backdrop-blur-sm transition hover:border-slate-300/80 dark:hover:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-500" />
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Targets</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Active Streaks</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Set a daily target, count active days, and track the gap at a glance.
              </p>
            </div>
            
            <div className="rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/20 p-5 backdrop-blur-sm transition hover:border-slate-300/80 dark:hover:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Social</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Friends Sync</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Compare progress with peers who keep you motivated and accountable.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Interactive Console Preview */}
        <section className="glass-card hover-lift rounded-[2.5rem] p-6 lg:p-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </span>
              <span>Accountability snapshot</span>
            </div>
            
            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-slate-800/60 bg-white/5 p-4 transition-all hover:bg-white/8">
                <p className="font-mono text-xs text-slate-400">Solved today</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-extrabold text-white tracking-tight">3</span>
                  <span className="text-xs text-emerald-400 font-medium">problems</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>100% of daily target met</span>
                </div>
              </div>
              
              <div className="rounded-xl border border-slate-800/60 bg-white/5 p-4 transition-all hover:bg-white/8">
                <p className="font-mono text-xs text-slate-400">Active days</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-extrabold text-white tracking-tight">12/30</span>
                  <span className="text-xs text-slate-400 font-medium">days active</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Consistent momentum</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-mono text-xs font-bold text-slate-300">Live Sync Features</p>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Real-time LeetCode profile syncing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Automatic difficulty distribution graph</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>Peer scoreboard comparisons</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
