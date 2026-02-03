<script lang="ts">
  import { Calendar, Building, Bookmark } from '@lucide/svelte';
  import { bookmarkStore } from '$lib/stores/bookmarkStore.svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  import { onMount } from 'svelte';
  import BookDetailPopup from './BookDetailPopup.svelte';

  interface Book {
    DOC_ID: number;
    title?: string;
    author?: string;
    other_authors?: string;
    year?: number;
    publisher?: string;
    publication_place?: string;
    isbn?: string;
    keywords?: string;
    cover_url?: string | null;
  }

  export let books: Book[] = [];

  let selectedBook: Book | null = null;
  let showOverlay = false;
  let showAllBooks = false;

  // Reactive bookmark state
  $: bookmarkedIds = bookmarkStore.bookmarks;
  $: displayedBooks = showAllBooks ? books : books.slice(0, 4);
  $: hasMoreBooks = books.length > 4;

  function handleBookClick(book: Book) {
    selectedBook = book;
    showOverlay = true;
  }

  function closeOverlay() {
    showOverlay = false;
  }

  function getAuthors(book: Book): string {
    return [book.author, book.other_authors]
      .filter(Boolean)
      .join(', ') || i18n.t('bookCards.authorNotSpecified');
  }

  async function handleBookmarkClick(docId: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Before toggle:', bookmarkStore.isBookmarked(docId));
    await bookmarkStore.toggleBookmark(docId);
    console.log('After toggle:', bookmarkStore.isBookmarked(docId));
    // Force re-check
    bookmarkedIds = bookmarkStore.bookmarks;
  }

  onMount(() => {
    bookmarkStore.initialize();
  });
</script>

<!-- Book Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
  {#each displayedBooks as book, index (book.DOC_ID || `book-${index}`)}
    <button
      onclick={() => handleBookClick(book)}
      class="book-card group"
    >
      <!-- Book Info -->
      <div class="book-info-compact">
        <div class="book-content">
          <h3 class="book-title">
            {book.title || i18n.t('bookCards.untitled')}
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
    </button>
  {/each}
</div>

<!-- Show More Button -->
{#if hasMoreBooks}
  <div class="show-more-container">
    <button
      onclick={() => showAllBooks = !showAllBooks}
      class="show-more-main-button"
    >
      {showAllBooks ? i18n.t('bookCards.showLess') : i18n.t('bookCards.showAll', { count: books.length })}
    </button>
  </div>
{/if}

<!-- Book Detail Popup -->
{#if showOverlay && selectedBook}
  <BookDetailPopup book={selectedBook} onClose={closeOverlay} />
{/if}

<style>
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
  }

  .book-card:hover {
    box-shadow: 0 8px 16px var(--shadow-md);
    border-color: var(--border-color-hover);
    transform: translateY(-2px);
  }

  .book-info-compact {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .book-content {
    min-width: 0;
  }

  .book-content {
    grid-column: 2;
    grid-row: 1 / 3;
    min-width: 0;
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
  }

  .book-meta {
    grid-column: 1 / -1;
    grid-row: 3;
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

  /* Show More Section */
  .show-more-container {
    padding: 0 0.5rem 0.5rem 0.5rem;
    display: flex;
    justify-content: center;
  }

  .show-more-main-button {
    padding: 0.75rem 1.5rem;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .show-more-main-button:hover {
    color: #4a7dc2;
    transform: scale(1.05);
  }
</style>
