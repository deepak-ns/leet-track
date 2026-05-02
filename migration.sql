-- Migration file generated from current Supabase database schema
-- Tables: profiles, friends, daily_stats, solved_problems

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    name text,
    leetcode_username text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    daily_target integer DEFAULT 1
);

-- Create friends table
CREATE TABLE public.friends (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    friend_user_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- Create daily_stats table
CREATE TABLE public.daily_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    stat_date date,
    total_solved integer DEFAULT 0,
    solved_today integer DEFAULT 0,
    daily_target integer DEFAULT 1,
    leetcode_username text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create solved_problems table
CREATE TABLE public.solved_problems (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    solved_date date,
    problem_slug text,
    problem_title text,
    created_at timestamptz DEFAULT now(),
    problem_difficulty text
);