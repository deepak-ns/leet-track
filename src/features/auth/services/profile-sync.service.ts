import type { User } from "@supabase/supabase-js";
import type { ProfileSyncInput } from "@/shared/types/domain";
import { supabase } from "@/shared/lib/supabase/client";
import { normalizeProfileFromUser } from "@/features/auth/utils/profile";

export async function syncProfile(input: ProfileSyncInput): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: input.id,
      name: input.name,
      leetcode_username: input.leetcodeUsername,
      daily_target: input.dailyTarget,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function syncProfileFromUserMetadata(user: User): Promise<void> {
  await syncProfile(normalizeProfileFromUser(user));
}

