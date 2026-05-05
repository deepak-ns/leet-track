import type {
  FriendDailyStatsRow,
  FriendLinkRow,
  FriendProfileRow,
} from "@/shared/types/database";
import type { FriendSearchResult } from "@/shared/types/domain";
import { supabase } from "@/shared/lib/supabase/client";

export async function getFriendIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("friends")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as FriendLinkRow[])
    .map((item) => item.friend_user_id ?? item.friend_id)
    .filter((id): id is string => Boolean(id));
}

export async function getFriendProfiles(
  friendIds: string[],
): Promise<FriendProfileRow[]> {
  if (!friendIds.length) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, leetcode_username, daily_target")
    .in("id", friendIds);

  if (error) {
    throw error;
  }

  return (data as FriendProfileRow[] | null) ?? [];
}

export async function getLatestFriendDailyStats(
  friendIds: string[],
): Promise<FriendDailyStatsRow[]> {
  if (!friendIds.length) return [];

  const { data, error } = await supabase
    .from("daily_stats")
    .select("user_id, leetcode_username, daily_target, stat_date")
    .in("user_id", friendIds)
    .order("stat_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as FriendDailyStatsRow[] | null) ?? [];
}

export async function searchFriendProfiles(
  query: string,
): Promise<FriendSearchResult[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, leetcode_username")
    .or(`name.ilike.%${query}%,leetcode_username.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw error;
  }

  return (data as FriendSearchResult[] | null) ?? [];
}

export async function searchFriendFallbackDailyStats(
  query: string,
): Promise<FriendSearchResult[]> {
  const { data, error } = await supabase
    .from("daily_stats")
    .select("user_id, leetcode_username")
    .ilike("leetcode_username", `%${query}%`)
    .limit(10);

  if (error) {
    throw error;
  }

  return ((data ?? []) as { user_id?: string; leetcode_username?: string | null }[])
    .map((row): FriendSearchResult | null => {
      if (!row.user_id) return null;
      return {
        id: row.user_id,
        name: null,
        leetcode_username: row.leetcode_username ?? null,
      };
    })
    .filter((item): item is FriendSearchResult => item !== null);
}

export async function addFriend(
  userId: string,
  friendUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("friends")
    .upsert(
      { user_id: userId, friend_user_id: friendUserId },
      { onConflict: "user_id,friend_user_id" },
    );

  if (!error) return;

  const { error: fallbackError } = await supabase
    .from("friends")
    .upsert(
      { user_id: userId, friend_id: friendUserId },
      { onConflict: "user_id,friend_id" },
    );

  if (fallbackError) {
    throw fallbackError;
  }
}

export async function removeFriend(
  userId: string,
  friendUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", userId)
    .eq("friend_user_id", friendUserId);

  if (!error) return;

  const { error: fallbackError } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", userId)
    .eq("friend_id", friendUserId);

  if (fallbackError) {
    throw fallbackError;
  }
}

