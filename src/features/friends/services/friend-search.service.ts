import type { FriendSearchResult } from "@/shared/types/domain";
import { searchFriendProfiles } from "@/features/friends/repositories/friends.repository";
import { supabase } from "@/shared/lib/supabase/client";

export async function searchFriends(
  query: string,
  currentUserId: string,
): Promise<FriendSearchResult[]> {
  const results = await searchFriendProfiles(query);

  // Fallback: also search daily_stats by leetcode_username if profile search returns nothing
  if (!results.length) {
    const { data } = await supabase
      .from("daily_stats")
      .select("user_id, leetcode_username")
      .ilike("leetcode_username", `%${query}%`)
      .limit(10);

    const fallback: FriendSearchResult[] = (
      (data ?? []) as {
        user_id?: string;
        leetcode_username?: string | null;
      }[]
    )
      .map((row): FriendSearchResult | null => {
        if (!row.user_id) return null;
        return {
          id: row.user_id,
          name: null,
          leetcode_username: row.leetcode_username ?? null,
        };
      })
      .filter((item): item is FriendSearchResult => item !== null);

    const seen = new Set(results.map((r) => r.id));
    for (const item of fallback) {
      if (!seen.has(item.id)) {
        results.push(item);
        seen.add(item.id);
      }
    }
  }

  return results.filter((r) => r.id !== currentUserId);
}
