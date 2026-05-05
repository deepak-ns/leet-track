import type { User } from "@supabase/supabase-js";
import type { ProfileSyncInput } from "@/shared/types/domain";
import { normalizePositiveInteger } from "@/shared/utils/number";

export function normalizeProfileFromUser(user: User): ProfileSyncInput {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: user.id,
    name: typeof metadata.name === "string" ? metadata.name : null,
    leetcodeUsername:
      typeof metadata.leetcode_username === "string"
        ? metadata.leetcode_username
        : null,
    dailyTarget: normalizePositiveInteger(metadata.daily_target, 1),
  };
}

