import type { FriendSearchResult } from "@/shared/types/domain";
import {
  addFriend,
  removeFriend,
  searchFriendFallbackDailyStats,
  searchFriendProfiles,
} from "@/features/friends/repositories/friends.repository";

export async function searchFriends(
  query: string,
  currentUserId: string | null,
): Promise<FriendSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  let results = await searchFriendProfiles(trimmed);

  if (!results.length) {
    const fallbackResults = await searchFriendFallbackDailyStats(trimmed);
    const uniqueById = new Map<string, FriendSearchResult>();
    fallbackResults.forEach((item) => uniqueById.set(item.id, item));
    results = Array.from(uniqueById.values());
  }

  return currentUserId
    ? results.filter((item) => item.id !== currentUserId)
    : results;
}

export { addFriend, removeFriend };

