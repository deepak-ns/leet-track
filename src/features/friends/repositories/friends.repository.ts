import type { FriendSearchResult } from "@/shared/types/domain";
import { supabase } from "@/shared/lib/supabase/client";

export async function getFriendIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("friends")
    .select("friend_user_id")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((row: { friend_user_id?: string | null }) => row.friend_user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function searchFriendProfiles(
  query: string,
): Promise<FriendSearchResult[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, leetcode_username")
    .or(`name.ilike.%${query}%,leetcode_username.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;

  return (data as FriendSearchResult[] | null) ?? [];
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
  if (error) throw error;
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
  if (error) throw error;
}
