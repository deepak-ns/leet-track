import type { FriendStatsViewModel } from "@/shared/types/domain";
import type {
  FriendDailyStatsRow,
  FriendProfileRow,
  UserDashboardStatsRow,
} from "@/shared/types/database";
import { getUsersDashboardStats } from "@/features/dashboard/repositories/dashboard.repository";
import {
  getFriendTarget,
  getFriendUsername,
  mapFriendStatsToViewModel,
} from "@/features/dashboard/services/dashboard.mapper";
import { syncLeetcodeStatsForUserId } from "@/features/dashboard/services/leetcode-sync.service";
import {
  getFriendIdsForUser,
  getFriendProfiles,
  getLatestFriendDailyStats,
} from "@/features/friends/repositories/friends.repository";

function mapById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function mapDailyStatsByUserId(
  rows: FriendDailyStatsRow[],
): Map<string, FriendDailyStatsRow> {
  const mapped = new Map<string, FriendDailyStatsRow>();
  for (const row of rows) {
    if (!mapped.has(row.user_id)) {
      mapped.set(row.user_id, row);
    }
  }
  return mapped;
}

function mapDashboardStatsByUserId(
  rows: UserDashboardStatsRow[],
): Map<string, UserDashboardStatsRow> {
  return new Map(rows.map((row) => [row.user_id, row]));
}

async function refreshFriendStats(
  friendIds: string[],
  profilesById: Map<string, FriendProfileRow>,
  dailyStatsById: Map<string, FriendDailyStatsRow>,
): Promise<void> {
  const concurrency = 4;
  const queue = friendIds.slice();
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const friendId = queue.shift();
      if (!friendId) return;

      const profile = profilesById.get(friendId);
      const fallbackStat = dailyStatsById.get(friendId);
      const username = getFriendUsername(profile, fallbackStat);
      if (!username) continue;

      try {
        await syncLeetcodeStatsForUserId({
          userId: friendId,
          leetcodeUsername: username,
          dailyTarget: getFriendTarget(profile, fallbackStat),
        });
      } catch {
        // Best effort refresh.
      }
    }
  });

  await Promise.all(workers);
}

export async function loadFriendsStats(
  userId: string,
  date: string,
): Promise<{ friendIds: string[]; rows: FriendStatsViewModel[] }> {
  void date;
  const friendIds = await getFriendIdsForUser(userId);
  if (!friendIds.length) {
    return { friendIds: [], rows: [] };
  }

  const [profiles, dailyStats] = await Promise.all([
    getFriendProfiles(friendIds),
    getLatestFriendDailyStats(friendIds),
  ]);

  const profilesById = mapById(profiles);
  const dailyStatsById = mapDailyStatsByUserId(dailyStats);

  await refreshFriendStats(friendIds, profilesById, dailyStatsById);

  const statsRows = await getUsersDashboardStats(friendIds);
  const statsByUserId = mapDashboardStatsByUserId(statsRows);

  return {
    friendIds,
    rows: friendIds.map((friendId) =>
      mapFriendStatsToViewModel({
        friendId,
        stat: statsByUserId.get(friendId) ?? null,
        profile: profilesById.get(friendId),
        fallbackStat: dailyStatsById.get(friendId),
      }),
    ),
  };
}
