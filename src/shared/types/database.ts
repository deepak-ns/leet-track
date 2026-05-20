export type FriendProfileRow = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
  daily_target: number | null;
};

export type SolvedProblemRow = {
  user_id?: string | null;
  problem_title?: string | null;
  problem_slug?: string | null;
  problem_difficulty?: string | null;
  solved_date?: string | null;
  created_at?: string | null;
};

export type FriendLinkRow = {
  friend_user_id?: string;
};
