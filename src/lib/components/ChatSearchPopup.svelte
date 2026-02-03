<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';
  import { Search, X, MessageSquare, Calendar, Loader2, AlertCircle } from '@lucide/svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let searchQuery = $state('');
  let isSearching = $state(false);
  let searchResults = $state<any[]>([]);
  let hasSearched = $state(false);

  // Reactive filter for conversations
  let filteredConversations = $derived(
    searchQuery.trim()
      ? chatStore.conversations.filter(conv =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : []
  );

  onMount(() => {
    const handleClick = (e: MouseEvent) => {
      const modal = document.querySelector('.popup-modal');
      if (modal && !modal.contains(e.target as Node)) {
        onClose();
      }
    };
  
    // use capture phase so clicks don’t get stopped by other elements
    document.addEventListener('click', handleClick, true);
  
    onDestroy(() => {
      document.removeEventListener('click', handleClick, true);
    });
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    isSearching = true;
    hasSearched = true;
    searchResults = [];

    try {
      // Search through all conversations
      const promises = chatStore.conversations.map(async (conv) => {
        try {
          const response = await fetch(`/api/c/${conv.id}`);
          if (!response.ok) return null;

          const data = await response.json();
          const messages = data.messages || [];

          // Check if any message contains the search query
          const matchingMessages = messages.filter((msg: any) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (matchingMessages.length > 0) {
            return {
              conversation: conv,
              matches: matchingMessages.length,
              preview: matchingMessages[0].content.substring(0, 150)
            };
          }
        } catch (error) {
          console.error(`Failed to search conversation ${conv.id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      searchResults = results.filter(Boolean);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      isSearching = false;
    }
  }

  async function handleConversationClick(conversationId: string) {
    await goto(`/c/${conversationId}`);
    onClose();
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return i18n.t('chatSearch.today');
    if (diffInDays === 1) return i18n.t('chatSearch.yesterday');
    if (diffInDays < 7) return i18n.t('chatSearch.daysAgo', { days: diffInDays });
    
    const locale = i18n.currentLanguage === 'kk' ? 'kk-KZ' : 
                   i18n.currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
    
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="popup-backdrop"
  transition:fade={{ duration: 200 }}
  role="presentation"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="popup-modal"
    onclick={(e) => e.stopPropagation()}
    transition:fly={{ y: 20, duration: 300 }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Header -->
    <div class="modal-header">
      <div class="flex-1">
        <h2 class="modal-title">{i18n.t('chatSearch.title')}</h2>
        <p class="modal-subtitle">{i18n.t('chatSearch.subtitle')}</p>
      </div>
      <button
        onclick={onClose}
        class="close-button"
        aria-label={i18n.t('chatSearch.close')}
      >
        <X size={24} />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <Search size={20} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={i18n.t('chatSearch.placeholder')}
          class="search-input"
        />
        {#if searchQuery}
          <button
            onclick={() => { searchQuery = ''; hasSearched = false; searchResults = []; }}
            class="clear-button"
            aria-label={i18n.t('chatSearch.clear')}
          >
            <X size={16} />
          </button>
        {/if}
      </div>
      <button
        onclick={handleSearch}
        disabled={!searchQuery.trim() || isSearching}
        class="search-button"
      >
        {#if isSearching}
          <Loader2 class="spinner" size={20} />
        {:else}
          {i18n.t('chatSearch.search')}
        {/if}
      </button>
    </div>

    <!-- Content -->
    <div class="modal-content">
      {#if isSearching}
        <div class="loading-state">
          <Loader2 class="spinner" size={32} />
          <span class="loading-text">{i18n.t('chatSearch.searching')}</span>
        </div>
      {:else if hasSearched && searchResults.length === 0}
        <div class="empty-state">
          <AlertCircle size={48} />
          <p class="empty-title">{i18n.t('chatSearch.noResults')}</p>
          <p class="empty-subtitle">{i18n.t('chatSearch.tryDifferent')}</p>
        </div>
      {:else if searchResults.length > 0}
        <div class="results-section">
          <h3 class="section-title">
            {i18n.t('chatSearch.foundMatches', { count: searchResults.length })}
          </h3>
          <div class="results-list">
            {#each searchResults as result}
              <button
                onclick={() => handleConversationClick(result.conversation.id)}
                class="result-item"
              >
                <div class="result-header">
                  <MessageSquare size={20} />
                  <h4 class="result-title">{result.conversation.title}</h4>
                </div>
                <p class="result-preview">{result.preview}...</p>
                <div class="result-footer">
                  <div class="result-meta">
                    <Calendar size={14} />
                    <span>{formatDate(result.conversation.updated_at)}</span>
                  </div>
                  <span class="result-matches">
                    {i18n.t('chatSearch.matches', { count: result.matches })}
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {:else if filteredConversations.length > 0 && searchQuery.trim()}
        <div class="results-section">
          <h3 class="section-title">
            {i18n.t('chatSearch.similarTitles')}
          </h3>
          <div class="results-list">
            {#each filteredConversations as conv}
              <button
                onclick={() => handleConversationClick(conv.id)}
                class="result-item"
              >
                <div class="result-header">
                  <MessageSquare size={20} />
                  <h4 class="result-title">{conv.title}</h4>
                </div>
                <div class="result-footer">
                  <div class="result-meta">
                    <Calendar size={14} />
                    <span>{formatDate(conv.updated_at)}</span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {:else if !hasSearched}
        <div class="empty-state">
          <Search size={48} />
          <p class="empty-title">{i18n.t('chatSearch.enterQuery')}</p>
          <p class="empty-subtitle">{i18n.t('chatSearch.searchAllChats')}</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .popup-backdrop {
    position: fixed;
    inset: 0;
    background: var(--bg-primary);
    opacity: 0.95;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .popup-modal {
    background: var(--bg-primary);
    border-radius: 12px;
    box-shadow: 0 20px 40px var(--shadow-lg);
    max-width: 48rem;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
  }

  .modal-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .modal-subtitle {
    color: var(--text-secondary);
    margin: 0;
  }

  .close-button {
    flex-shrink: 0;
    color: var(--text-tertiary);
    transition: color 0.3s ease;
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    color: var(--text-secondary);
  }

  .search-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    gap: 0.75rem;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input-wrapper :global(.search-icon) {
    position: absolute;
    left: 1rem;
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 3rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.9375rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a7dc2;
    background: var(--bg-primary);
  }

  .clear-button {
    position: absolute;
    right: 0.75rem;
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .clear-button:hover {
    color: var(--text-secondary);
  }

  .search-button {
    padding: 0.75rem 1.5rem;
    background: #4a7dc2;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .search-button:hover:not(:disabled) {
    background: #3d6aa8;
  }

  .search-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 1rem;
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
    color: #4a7dc2;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: var(--text-secondary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 0.75rem;
    color: var(--text-tertiary);
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .empty-subtitle {
    color: var(--text-secondary);
    margin: 0;
  }

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-item {
    width: 100%;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-item:hover {
    background: var(--bg-tertiary);
    border-color: #4a7dc2;
    transform: translateY(-1px);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .result-header :global(svg) {
    color: #4a7dc2;
    flex-shrink: 0;
  }

  .result-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-preview {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .result-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8125rem;
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-tertiary);
  }

  .result-meta :global(svg) {
    flex-shrink: 0;
  }

  .result-matches {
    color: #4a7dc2;
    font-weight: 500;
  }

  :global(body:has(.popup-backdrop)) {
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .search-section {
      flex-direction: column;
    }

    .search-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
