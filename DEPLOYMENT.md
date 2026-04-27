# Vercel Deployment Guide

## Prerequisites

- GitHub account (your repository pushed to GitHub)
- Vercel account (free tier available at vercel.com)
- Supabase project with credentials

## Steps to Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/leet-track.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository (`leet-track`)
4. Click "Import"

### 3. Configure Environment Variables

In the Vercel dashboard, under "Environment Variables", add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
```

**To find these values:**

1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the `Project URL` and `anon public` key

### 4. Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your app
3. Your app will be live at `https://your-app.vercel.app`

## Verifying the Deployment

- The app builds successfully (Next.js 16.2.4)
- TypeScript compilation passes ✅
- All environment variables are properly prefixed with `NEXT_PUBLIC_` ✅
- ESLint configuration is in place ✅
- Build script in package.json is configured ✅

## Database Setup on Supabase

Make sure your Supabase project has the following tables:

- `profiles` - User profiles (id, name, leetcode_username, daily_target)
- `daily_stats` - Daily statistics (user_id, leetcode_username, daily_target, stat_date, etc.)
- `user_dashboard_stats` - Aggregated dashboard stats
- `friends` - Friend relationships (user_id, friend_user_id)

## After Deployment

- Update your Supabase CORS settings to allow your Vercel domain
- Test login/signup flow
- Verify LeetCode data syncing works
- Check that stats are updating correctly

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel
