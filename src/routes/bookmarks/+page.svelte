<script lang="ts">
  import { Bookmark, Calendar, Building } from '@lucide/svelte';
  import { bookmarkStore } from '$lib/stores/bookmarkStore.svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  import { onMount } from 'svelte';
  import BookDetailPopup from '$lib/components/BookDetailPopup.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const bookmarkedIds = $derived(bookmarkStore.bookmarks);

  const displayedBooks = $derived(
    (data?.books ?? []).filter((book: any) =>
      bookmarkedIds.includes(book.DOC_ID)
    )
  );

  let selectedBook: any | null = $state(null);
  let showOverlay = $state(false);

  function getAuthors(book: any) {
    if (book.author || book.other_authors) {
      const parts = [];
      if (book.author) parts.push(book.author);
      if (book.other_authors) parts.push(book.other_authors);
      return parts.join(', ');
    }
    return i18n.t('bookmarks.authorNotSpecified');
  }

  async function handleBookmarkClick(docId: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await bookmarkStore.toggleBookmark(docId);
  }

  function handleBookClick(book: any) {
    selectedBook = book;
    showOverlay = true;
  }

  function closeOverlay() {
    showOverlay = false;
  }

  onMount(() => {
    bookmarkStore.initialize();
  });
</script>

<svelte:head>
  <title>{i18n.t('bookmarks.title')}</title>
</svelte:head>

<div class="bookmarks-page">
  <div class="page-header">
    <p class="subtitle">
      {#if displayedBooks.length === 0}
        {i18n.t('bookmarks.emptySubtitle')}
      {:else}
        {i18n.t('bookmarks.savedCount', { count: displayedBooks.length })}
      {/if}
    </p>
  </div>

  {#if displayedBooks.length > 0}
    <!-- Book Cards Container -->
    <div class="books-container">
      {#each displayedBooks as book (book.DOC_ID)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="book-card"
          onclick={() => handleBookClick(book)}
        >
          <!-- Bookmark Button -->
          <button
            class="bookmark-button"
            onclick={(e) => handleBookmarkClick(book.DOC_ID, e)}
            aria-label={i18n.t('bookmarks.remove')}
          >
            <Bookmark
              size={20}
              fill="currentColor"
            />
          </button>

          <div class="book-info-compact">
            <div class="book-content">
              <h3 class="book-title">
                {book.title || i18n.t('bookmarks.untitled')}
              </h3>
              <p class="book-author">
                {getAuthors(book)}
              </p>
            </div>
            
            <div class="book-meta">
              {#if book.year}
                <span class="meta-item">
                  <Calendar size={16} />
                  {book.year}
                </span>
              {/if}
              {#if book.publisher}
                <span class="meta-item">
                  <Building size={16} />
                  {book.publisher}
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <Bookmark size={64} strokeWidth={1.5} />
      <h2>{i18n.t('bookmarks.emptyTitle')}</h2>
      <p>{i18n.t('bookmarks.emptyDescription')}</p>
      <a href="/" class="cta-btn">
        {i18n.t('bookmarks.startBrowsing')}
      </a>
    </div>
  {/if}
</div>

<!-- Book Detail Popup -->
{#if showOverlay && selectedBook}
  <BookDetailPopup book={selectedBook} onClose={closeOverlay} />
{/if}

<style>
  .bookmarks-page {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  /* Book Cards Container */
  .books-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  /* Book Card Styles */
  .book-card {
    background: var(--bg-secondary);
    border-radius: 12px;
    box-shadow: 0 1px 4px var(--shadow-sm);
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    min-height: 150px;
    padding: 0;
    position: relative;
  }

  .book-card:hover {
    box-shadow: 0 8px 16px var(--shadow-md);
    border-color: var(--border-color-hover);
    transform: translateY(-2px);
  }

  .bookmark-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #4a7dc2;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    transition: all 0.2s ease;
    z-index: 1;
  }

  .bookmark-button:hover {
    color: #dc2626;
    transform: scale(1.1);
  }

  .book-info-compact {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .book-content {
    min-width: 0;
    padding-right: 2rem;
  }

  .book-title {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
    line-height: 1.4;
  }

  .book-author {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .book-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.813rem;
    color: var(--text-tertiary);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .meta-item :global(svg) {
    color: var(--text-tertiary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
  }

  .empty-state :global(svg) {
    opacity: 0.3;
    margin-bottom: 1.5rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  .empty-state p {
    max-width: 400px;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #4a7dc2;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .cta-btn:hover {
    background: #3d6ba8;
  }

  @media (max-width: 768px) {
    .bookmarks-page {
      padding: 1rem;
    }

    .books-container {
      grid-template-columns: 1fr;
    }

    .empty-state {
      padding: 3rem 1rem;
    }
  }
</style>
