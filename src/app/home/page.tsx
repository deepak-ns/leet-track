"use client";

import { useRouter } from "next/navigation";
import { getTodayDateKey } from "@/shared/utils/date";
import { signOut } from "@/features/auth/services/session.service";
import { DashboardPageShell } from "@/features/dashboard/components/DashboardPageShell";
import { ErrorBanner } from "@/features/dashboard/components/ErrorBanner";
import { MetricsSection } from "@/features/dashboard/components/MetricsSection";
import { TodayProblemsSection } from "@/features/dashboard/components/TodayProblemsSection";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { FriendsSection } from "@/features/friends/components/FriendsSection";
import { useFriendSearch } from "@/features/friends/hooks/useFriendSearch";
import { useFriendsStats } from "@/features/friends/hooks/useFriendsStats";
import { HistorySection } from "@/features/history/components/HistorySection";
import { useSolvedHistory } from "@/features/history/hooks/useSolvedHistory";

export default function DashboardPage() {
  const router = useRouter();
  const {
    friendsStats,
    friendsStatsLoading,
    friendError: friendsLoadError,
    setFriendError: setFriendsLoadError,
    loadFriendsStats,
  } = useFriendsStats();
  const { stats, cards, focusSummary, loading, errorMessage, currentUser } =
    useDashboardData(loadFriendsStats);
  const currentUserId = currentUser?.id ?? null;
  const history = useSolvedHistory(currentUserId);

  async function refreshFriends() {
    if (!currentUserId) {
      return;
    }

    await loadFriendsStats(currentUserId, getTodayDateKey());
  }

  const friendSearch = useFriendSearch({
    currentUserId,
    onFriendsChanged: refreshFriends,
    onRemovedSelectedFriend: history.clearSelectedFriend,
  });

  const combinedFriendError = friendSearch.friendError ?? friendsLoadError;

  async function handleLogout() {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  return (
    <DashboardPageShell
      userName={stats.userName}
      leetcodeUsername={stats.leetcodeUsername}
      focusSummary={focusSummary}
      onLogout={handleLogout}
    >
      <ErrorBanner message={errorMessage} />
      <MetricsSection cards={cards} loading={loading} />
      <TodayProblemsSection
        loading={loading}
        todaySolved={stats.todaySolved}
        problems={stats.todaySolvedProblems}
      />
      <FriendsSection
        searchTerm={friendSearch.searchTerm}
        searchResults={friendSearch.searchResults}
        searchLoading={friendSearch.searchLoading}
        showSuggestions={friendSearch.showSuggestions}
        friendError={combinedFriendError}
        friendMessage={friendSearch.friendMessage}
        friendsStats={friendsStats}
        friendsStatsLoading={friendsStatsLoading}
        selectedFriendId={history.selectedFriendId}
        removingFriendId={friendSearch.removingFriendId}
        onSearchChange={(value) => {
          setFriendsLoadError(null);
          friendSearch.handleSearchInputChange(value);
        }}
        onSearch={friendSearch.handleFriendSearch}
        onShowSuggestions={() => friendSearch.setShowSuggestions(true)}
        onHideSuggestions={() => friendSearch.setShowSuggestions(false)}
        onAddFriend={friendSearch.handleAddFriend}
        onRemoveFriend={friendSearch.handleRemoveFriend}
        onSelectFriend={history.loadFriendHistory}
      />
      <HistorySection
        selectedFriendName={history.selectedFriendName}
        showingUserHistory={history.showingUserHistory}
        groupedHistory={history.groupedHistory}
        totalCount={history.activeHistory.length}
        friendHistoryLoading={history.friendHistoryLoading}
        userHistoryLoading={history.userHistoryLoading}
        friendHistoryError={history.friendHistoryError}
        userHistoryError={history.userHistoryError}
        onLoadUserHistory={history.loadUserHistory}
      />
    </DashboardPageShell>
  );
}
