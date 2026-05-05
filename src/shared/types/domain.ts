export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type ProblemLink = {
  title: string;
  slug: string | null;
  difficulty: ProblemDifficulty | null;
};

export type DashboardStatsViewModel = {
  totalSolved: number;
  todaySolved: number;
  problemsSolvedSinceSignup: number;
  dailyTarget: number;
  activeFraction: string;
  todaySolvedProblems: ProblemLink[];
  userName: string | null;
  leetcodeUsername: string | null;
};

export type FriendSearchResult = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
};

export type FriendStatsViewModel = {
  id: string;
  name: string;
  todaySolved: number;
  problemsSolvedSinceSignup: number;
  todayProblems: ProblemLink[];
  activeFraction: string;
  leetcodeUsername: string | null;
};

export type SolvedProblemHistoryItem = {
  solvedDate: string;
  createdAt: string;
  problemTitle: string;
  problemSlug: string | null;
  problemDifficulty: ProblemDifficulty | null;
};

export type HistoryGroup = {
  date: string;
  entries: SolvedProblemHistoryItem[];
};

export type NormalizedSubmissionRecord = {
  timestamp?: number | string;
  time?: number | string;
  submittedAt?: number | string;
  createdAt?: number | string;
  statusDisplay?: string;
  status?: string;
  title?: string;
  titleSlug?: string;
  questionTitle?: string;
  questionSlug?: string;
  problemTitle?: string;
  name?: string;
  difficulty?: string | number;
  diff?: string | number;
  level?: string | number;
};

export type SolvedTodayProblem = {
  slug: string;
  title: string;
  solvedAtMs: number;
  difficulty: ProblemDifficulty | null;
};

export type LeetCodeSyncInput = {
  userId: string;
  leetcodeUsername: string;
  dailyTarget: number;
};

export type ProfileSyncInput = {
  id: string;
  name: string | null;
  leetcodeUsername: string | null;
  dailyTarget: number;
};

