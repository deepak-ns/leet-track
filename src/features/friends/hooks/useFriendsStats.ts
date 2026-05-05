"use client";

import { useCallback, useState } from "react";
import type { FriendStatsViewModel } from "@/shared/types/domain";
import { loadFriendsStats } from "@/features/friends/services/friends-stats.service";

export function useFriendsStats() {
  const [friendsStats, setFriendsStats] = useState<FriendStatsViewModel[]>([]);
  const [friendsStatsLoading, setFriendsStatsLoading] = useState(false);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendError, setFriendError] = useState<string | null>(null);

  const load = useCallback(async (userId: string, date: string) => {
    setFriendsStatsLoading(true);
    try {
      const result = await loadFriendsStats(userId, date);
      setFriendIds(result.friendIds);
      setFriendsStats(result.rows);
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Unable to load friend stats.",
      );
    } finally {
      setFriendsStatsLoading(false);
    }
  }, []);

  return {
    friendIds,
    friendsStats,
    friendsStatsLoading,
    friendError,
    setFriendError,
    loadFriendsStats: load,
  };
}

