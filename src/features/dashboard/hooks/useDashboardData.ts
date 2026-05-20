"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { DashboardStatsViewModel } from "@/shared/types/domain";
import { getCurrentUser } from "@/features/auth/services/session.service";
import { getUserDashboardData } from "@/features/dashboard/repositories/dashboard.repository";
import { mapUserDataToViewModel } from "@/features/dashboard/services/dashboard.mapper";
import { getTodayDateKey } from "@/shared/utils/date";

const emptyStats: DashboardStatsViewModel = {
  totalSolved: 0,
  todaySolved: 0,
  problemsSolvedSinceSignup: 0,
  dailyTarget: 1,
  activeFraction: "0/1",
  todaySolvedProblems: [],
  userName: null,
  leetcodeUsername: null,
};

export function useDashboardData(
  loadFriends: (userId: string, date: string) => Promise<void>,
) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsViewModel>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);

        const today = getTodayDateKey();
        // Load friends and own stats in parallel
        const [, data] = await Promise.all([
          loadFriends(user.id, today),
          getUserDashboardData(user.id, today),
        ]);

        const userMetaName =
          typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null;

        setStats(mapUserDataToViewModel(data, userMetaName));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard metrics right now.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Total Problems Solved",
        value: stats.totalSolved,
        subtitle: stats.leetcodeUsername
          ? `@${stats.leetcodeUsername}`
          : "Add LeetCode username on signup",
        accent: "blue" as const,
      },
      {
        label: "Problems Solved Today",
        value: stats.todaySolved,
        accent: "green" as const,
      },
      {
        label: "Problems Solved Since Signup",
        value: stats.problemsSolvedSinceSignup,
        accent: "rose" as const,
      },
      {
        label: "Daily Target",
        value: stats.dailyTarget,
        subtitle: "Problems/day",
        accent: "amber" as const,
      },
      {
        label: "Active Days",
        value: stats.activeFraction,
        subtitle: "Active days / total tracked days",
        accent: "violet" as const,
      },
    ],
    [stats],
  );

  const remaining = Math.max(stats.dailyTarget - stats.todaySolved, 0);
  const focusSummary =
    stats.todaySolved >= stats.dailyTarget
      ? "You have already hit today's target."
      : `${remaining} more problem${remaining === 1 ? "" : "s"} to reach today's target.`;

  return {
    stats,
    cards,
    focusSummary,
    loading,
    errorMessage,
    currentUser,
  };
}
