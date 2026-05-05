"use client";

import { useMemo, useState } from "react";
import type {
  HistoryGroup,
  SolvedProblemHistoryItem,
} from "@/shared/types/domain";
import {
  groupSolvedHistory,
  loadSolvedHistory,
} from "@/features/history/services/history.service";

export function useSolvedHistory(currentUserId: string | null) {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriendName, setSelectedFriendName] = useState<string | null>(
    null,
  );
  const [friendHistory, setFriendHistory] = useState<SolvedProblemHistoryItem[]>(
    [],
  );
  const [friendHistoryLoading, setFriendHistoryLoading] = useState(false);
  const [friendHistoryError, setFriendHistoryError] = useState<string | null>(
    null,
  );
  const [userHistory, setUserHistory] = useState<SolvedProblemHistoryItem[]>([]);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userHistoryError, setUserHistoryError] = useState<string | null>(null);
  const [showingUserHistory, setShowingUserHistory] = useState(false);

  async function loadFriendHistory(friendId: string, friendName: string | null) {
    if (selectedFriendId === friendId) {
      document.getElementById("history-section")?.scrollIntoView({
        behavior: "smooth",
      });
      return;
    }

    setSelectedFriendId(friendId);
    setSelectedFriendName(friendName);
    setFriendHistory([]);
    setFriendHistoryError(null);
    setFriendHistoryLoading(true);
    setShowingUserHistory(false);

    try {
      setFriendHistory(await loadSolvedHistory(friendId));
      setTimeout(() => {
        document.getElementById("history-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      setFriendHistoryError(
        error instanceof Error
          ? error.message
          : "Unable to load friend history.",
      );
    } finally {
      setFriendHistoryLoading(false);
    }
  }

  async function loadUserHistory() {
    if (!currentUserId) return;
    if (showingUserHistory) {
      document.getElementById("history-section")?.scrollIntoView({
        behavior: "smooth",
      });
      return;
    }

    setShowingUserHistory(true);
    setSelectedFriendId(null);
    setSelectedFriendName(null);
    setUserHistory([]);
    setUserHistoryError(null);
    setUserHistoryLoading(true);

    try {
      setUserHistory(await loadSolvedHistory(currentUserId));
      setTimeout(() => {
        document.getElementById("history-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      setUserHistoryError(
        error instanceof Error ? error.message : "Unable to load your history.",
      );
    } finally {
      setUserHistoryLoading(false);
    }
  }

  function clearSelectedFriend(friendUserId: string) {
    if (selectedFriendId !== friendUserId) {
      return;
    }

    setSelectedFriendId(null);
    setSelectedFriendName(null);
    setFriendHistory([]);
    setFriendHistoryError(null);
  }

  const activeHistory = showingUserHistory ? userHistory : friendHistory;
  const groupedHistory: HistoryGroup[] = useMemo(
    () => groupSolvedHistory(activeHistory),
    [activeHistory],
  );

  return {
    selectedFriendId,
    selectedFriendName,
    showingUserHistory,
    friendHistoryLoading,
    friendHistoryError,
    userHistoryLoading,
    userHistoryError,
    activeHistory,
    groupedHistory,
    loadFriendHistory,
    loadUserHistory,
    clearSelectedFriend,
  };
}
