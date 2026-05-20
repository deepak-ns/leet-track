"use client";

import { useCallback, useState } from "react";
import type { FriendStatsViewModel } from "@/shared/types/domain";
import { getFriendIdsForUser } from "@/features/friends/repositories/friends.repository";
import { getFriendsDashboardData } from "@/features/dashboard/repositories/dashboard.repository";
import { mapFriendDataToViewModel } from "@/features/dashboard/services/dashboard.mapper";

export function useFriendsStats() {
  const [friendsStats, setFriendsStats] = useState<FriendStatsViewModel[]>([]);
  const [friendsStatsLoading, setFriendsStatsLoading] = useState(false);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendError, setFriendError] = useState<string | null>(null);

  const load = useCallback(async (userId: string, date: string) => {
    setFriendsStatsLoading(true);
    try {
      const ids = await getFriendIdsForUser(userId);
      setFriendIds(ids);

      if (!ids.length) {
        setFriendsStats([]);
        return;
      }

      const friendsData = await getFriendsDashboardData(ids, date);
      setFriendsStats(friendsData.map(mapFriendDataToViewModel));
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
