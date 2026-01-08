// src/lib/stores/bookmarkStore.svelte.ts
import { browser } from '$app/environment';

let state = $state({
  bookmarkedIds: [] as number[],
  isLoading: false,
  isInitialized: false
});

export const bookmarkStore = {
  get bookmarks() {
    return state.bookmarkedIds;
  },

  get isLoading() {
    return state.isLoading;
  },

  isBookmarked(docId: number) {
    return state.bookmarkedIds.includes(docId);
  },

  async initialize() {
    if (!browser || state.isInitialized) return;
    
    state.isLoading = true;
    try {
      const response = await fetch('/api/bookmarks');
      if (response.ok) {
        const data = await response.json();
        state.bookmarkedIds = data.bookmarks || [];
        state.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      state.isLoading = false;
    }
  },

  async toggleBookmark(docId: number) {
    console.log('toggleBookmark called, current bookmarks:', state.bookmarkedIds);
    const isCurrentlyBookmarked = state.bookmarkedIds.includes(docId);
    console.log('Is currently bookmarked:', isCurrentlyBookmarked);

    // Optimistic update
    if (isCurrentlyBookmarked) {
      state.bookmarkedIds = state.bookmarkedIds.filter(id => id !== docId);
      console.log('Removing from bookmarks');
    } else {
      state.bookmarkedIds = [...state.bookmarkedIds, docId];
      console.log('Adding to bookmarks');
    }
    console.log('New bookmarks:', state.bookmarkedIds);

    try {
      const response = await fetch('/api/bookmarks', {
        method: isCurrentlyBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc_id: docId }),
      });

      if (!response.ok) {
        // Revert on failure
        if (isCurrentlyBookmarked) {
          state.bookmarkedIds = [...state.bookmarkedIds, docId];
        } else {
          state.bookmarkedIds = state.bookmarkedIds.filter(id => id !== docId);
        }
        console.error('Failed to update bookmark:', response.status);
        throw new Error('Failed to update bookmark');
      }

      return !isCurrentlyBookmarked;
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      return isCurrentlyBookmarked;
    }
  },

  reset() {
    state.bookmarkedIds = [];
    state.isInitialized = false;
  }
};
