"use client";

import { useEffect, useRef, useState } from "react";
import type { FriendSearchResult } from "@/shared/types/domain";
import { searchFriends } from "@/features/friends/services/friend-search.service";
import {
  addFriend,
  removeFriend,
} from "@/features/friends/repositories/friends.repository";

type UseFriendSearchArgs = {
  currentUserId: string | null;
  onFriendsChanged: () => Promise<void>;
  onRemovedSelectedFriend: (friendUserId: string) => void;
};

export function useFriendSearch({
  currentUserId,
  onFriendsChanged,
  onRemovedSelectedFriend,
}: UseFriendSearchArgs) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function runSearch(query: string, showDropdown = false) {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      if (showDropdown) {
        setShowSuggestions(false);
      }
      return;
    }

    setSearchLoading(true);
    setFriendError(null);
    setFriendMessage(null);

    try {
      const results = await searchFriends(trimmed, currentUserId ?? "");
      setSearchResults(results);
      if (showDropdown) {
        setShowSuggestions(results.length > 0);
      }
      if (!results.length) {
        setFriendMessage(
          "No users found. Ask your friend to log in once so their profile or stats are created.",
        );
      }
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Failed to search users.",
      );
      setSearchResults([]);
      if (showDropdown) {
        setShowSuggestions(false);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleFriendSearch() {
    const query = searchTerm.trim();
    if (!query) {
      setSearchResults([]);
      setFriendError("Enter a name or LeetCode username.");
      setFriendMessage(null);
      return;
    }

    await runSearch(query, false);
  }

  function handleSearchInputChange(value: string) {
    setSearchTerm(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      setFriendError(null);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      void runSearch(value, true);
    }, 500);
  }

  async function handleAddFriend(friendUserId: string) {
    if (!currentUserId) {
      setFriendError("You must be logged in to add friends.");
      return;
    }
    if (friendUserId === currentUserId) {
      setFriendError("You cannot add yourself as a friend.");
      return;
    }

    setAddingFriendId(friendUserId);
    setFriendError(null);
    setFriendMessage(null);

    try {
      await addFriend(currentUserId, friendUserId);
      setFriendMessage("Friend added successfully.");
      await onFriendsChanged();
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Failed to add friend.",
      );
    } finally {
      setAddingFriendId(null);
    }
  }

  async function handleRemoveFriend(friendUserId: string) {
    if (!currentUserId) {
      setFriendError("You must be logged in to remove friends.");
      return;
    }

    setRemovingFriendId(friendUserId);
    setFriendError(null);
    setFriendMessage(null);

    try {
      await removeFriend(currentUserId, friendUserId);
      setFriendMessage("Friend removed successfully.");
      onRemovedSelectedFriend(friendUserId);
      await onFriendsChanged();
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Failed to remove friend.",
      );
    } finally {
      setRemovingFriendId(null);
    }
  }

  return {
    searchTerm,
    searchResults,
    searchLoading,
    friendMessage,
    friendError,
    addingFriendId,
    removingFriendId,
    showSuggestions,
    setShowSuggestions,
    handleFriendSearch,
    handleSearchInputChange,
    handleAddFriend,
    handleRemoveFriend,
  };
}
