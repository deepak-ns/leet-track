export type FriendProfileRow = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
  daily_target: number | null;
};

export type FriendDailyStatsRow = {
  user_id: string;
  leetcode_username: string | null;
  daily_target: number | null;
  stat_date: string | null;
};

export type UserDashboardStatsRow = {
  user_id: string;
  name: string | null;
  total_solved: number | null;
  daily_target: number | null;
  solved_today: number | null;
  today_problem_titles: string[] | null;
  today_problem_slugs: string[] | null;
  today_problem_difficulties: string[] | null;
  problems_solved_since_signup: number | null;
  active_fraction: string | null;
};

export type SolvedProblemRow = {
  problem_title?: string | null;
  problem_slug?: string | null;
  problem_difficulty?: string | null;
  solved_date?: string | null;
  created_at?: string | null;
};

export type FriendLinkRow = {
  friend_user_id?: string;
  friend_id?: string;
};

