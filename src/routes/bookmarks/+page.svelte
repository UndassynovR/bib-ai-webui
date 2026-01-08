<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Bookmark, X, Calendar, Building, MapPin, Hash, Tag, BookOpenText, Loader2, AlertCircle, AlertTriangle } from '@lucide/svelte';
  import { bookmarkStore } from '$lib/stores/bookmarkStore.svelte';
  import { onMount } from 'svelte';
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
    return 'Автор не указан';
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showOverlay) {
      closeOverlay();
    }
  }

  onMount(() => {
    bookmarkStore.initialize();
  });
</script>

<svelte:head>
  <title>Закладки</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="bookmarks-page">
  <div class="page-header">
    <p class="subtitle">
      {#if displayedBooks.length === 0}
        У вас пока нет сохраненных книг
      {:else}
        Сохранено книг: {displayedBooks.length}
      {/if}
    </p>
  </div>

  {#if displayedBooks.length > 0}
    <!-- Book Cards Container -->
    <div class="books-container">
      {#each displayedBooks as book (book.DOC_ID)}
        <!-- svelte_ignore a11y_click_events_have_key_events -->
        <!-- svelte_ignore a11y_no_static_element_interactions -->
        <div
          class="book-card"
          onclick={() => handleBookClick(book)}
          title={book.title}
        >
          <button
            class="bookmark-wrapper"
            onclick={(e) => handleBookmarkClick(book.DOC_ID, e)}
            aria-label="Удалить из закладок"
          >
            <Bookmark 
              size={20}
              fill="currentColor"
            />
          </button>
          
          <h3 class="book-title" title={book.title}>{book.title}</h3>
          
          <div class="authors-row">
            <p class="authors" title={getAuthors(book) !== 'Автор не указан' ? `Автор: ${getAuthors(book)}` : 'Автор не указан'}>
              {getAuthors(book)}
            </p>
          </div>
          
          <div class="details-row">
            <span class="detail-item" title={book.year ? `Год: ${book.year}` : 'Год не указан'}>
              {book.year || '-'}
            </span>
            <span class="detail-item" title={book.publisher ? `Издательство: ${book.publisher}` : 'Издательство не указано'}>
              {book.publisher || '-'}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <Bookmark size={64} strokeWidth={1.5} />
      <h2>Нет сохраненных книг</h2>
      <p>Начните добавлять книги в закладки, чтобы они появились здесь</p>
      <a href="/" class="cta-btn">
        Начать просмотр
      </a>
    </div>
  {/if}
</div>

<!-- Book Detail Popup -->
{#if showOverlay && selectedBook}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="popup-backdrop"
    onclick={closeOverlay}
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
        <div class="flex-1 pr-4">
          <h2 class="modal-title">
            {selectedBook.title || 'Без названия'}
          </h2>
          <p class="modal-subtitle">{getAuthors(selectedBook)}</p>
        </div>
        <div class="header-actions">
          <button
            onclick={(e) => handleBookmarkClick(selectedBook.DOC_ID, e)}
            class="bookmark-button"
            aria-label="Удалить из закладок"
          >
            <Bookmark 
              size={24}
              fill="currentColor"
            />
          </button>
          <button
            onclick={closeOverlay}
            class="close-button"
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Description Section -->
        <div>
          <h3 class="section-title">
            <BookOpenText size={20} />
            Описание
          </h3>
                  
          {#await fetch(`/api/descriptions/${selectedBook.DOC_ID}`).then(r => r.json())}
            <div class="loading-state">
              <Loader2 class="spinner" size={32} />
              <span class="loading-text">Загрузка описания...</span>
            </div>
          {:then data}
            {#if data.failed || !data.description}
              <div class="warning-box">
                <AlertTriangle size={20} />
                <p>Описание недоступно</p>
              </div>
            {:else}
              <p class="description-text">{data.description}</p>
            {/if}
          {:catch error}
            <div class="error-box">
              <AlertCircle size={20} />
              <p>Ошибка загрузки описания</p>
            </div>
          {/await}
        </div>

        <!-- Book Details Grid -->
        <div class="details-section">
          <h3 class="section-title-secondary">Информация о книге</h3>
          <div class="details-grid">
                      
            {#if selectedBook.year}
              <div class="detail-item">
                <Calendar size={20} />
                <div>
                  <p class="detail-label">Год издания</p>
                  <p class="detail-value">{selectedBook.year}</p>
                </div>
              </div>
            {/if}

            {#if selectedBook.publisher}
              <div class="detail-item">
                <Building size={20} />
                <div>
                  <p class="detail-label">Издательство</p>
                  <p class="detail-value">{selectedBook.publisher}</p>
                </div>
              </div>
            {/if}

            {#if selectedBook.publication_place}
              <div class="detail-item">
                <MapPin size={20} />
                <div>
                  <p class="detail-label">Место издания</p>
                  <p class="detail-value">{selectedBook.publication_place}</p>
                </div>
              </div>
            {/if}

            {#if selectedBook.isbn}
              <div class="detail-item">
                <Hash size={20} />
                <div>
                  <p class="detail-label">ISBN</p>
                  <p class="detail-value isbn">{selectedBook.isbn}</p>
                </div>
              </div>
            {/if}

            {#if selectedBook.keywords}
              <div class="detail-item keywords-item">
                <Tag size={20} />
                <div class="flex-1">
                  <p class="detail-label">Ключевые слова</p>
                  <div class="keywords-container">
                    {#each selectedBook.keywords.split(',') as keyword}
                      <span class="keyword-tag">
                        {keyword.trim()}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
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
    gap: 1rem;
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
    padding: 1.25rem;
    gap: 0.75rem;
    position: relative;
    min-height: 180px;
  }

  .book-card:hover {
    box-shadow: 0 8px 16px var(--shadow-md);
    border-color: var(--border-color-hover);
    transform: translateY(-2px);
  }

  .bookmark-wrapper {
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

  .bookmark-wrapper:hover {
    color: #dc2626;
    transform: scale(1.1);
  }

  .book-title {
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--text-primary);
    line-height: 1.4;
    padding-right: 2rem;
    margin: 0;
  }

  .authors-row {
    margin-bottom: 0.5rem;
  }

  .authors {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .details-row {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--text-tertiary);
    margin-top: auto;
  }

  .detail-item {
    padding: 0.35rem 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
    border: 1px solid var(--border-color);
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

  /* Popup Styles */
  .popup-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
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
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .bookmark-button {
    background: transparent;
    border: none;
    color: #4a7dc2;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .bookmark-button:hover {
    color: #dc2626;
    background: var(--bg-secondary);
  }

  .close-button {
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    color: var(--text-secondary);
    background: var(--bg-secondary);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-title :global(svg) {
    color: #4a7dc2;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    flex-direction: column;
    gap: 0.75rem;
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
    font-size: 0.9rem;
  }

  .warning-box {
    display: flex;
    align-items: start;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef3cd;
    border: 1px solid #f0d896;
    border-radius: 8px;
    color: #8a6d3b;
  }

  .warning-box :global(svg) {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-box {
    display: flex;
    align-items: start;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8d7da;
    border: 1px solid #f1b0b7;
    border-radius: 8px;
    color: #842029;
  }

  .error-box :global(svg) {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .description-text {
    color: var(--text-primary);
    line-height: 1.7;
  }

  .details-section {
    border-top: 1px solid var(--border-color);
    padding-top: 1.5rem;
  }

  .section-title-secondary {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .details-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .detail-item {
    display: flex;
    align-items: start;
    gap: 0.75rem;
  }

  .keywords-item {
    grid-column: 1 / -1;
  }

  .detail-item :global(svg) {
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .detail-label {
    font-size: 0.875rem;
    color: var(--text-tertiary);
  }

  .detail-value {
    color: var(--text-primary);
    font-weight: 500;
  }

  .detail-value.isbn {
    font-family: monospace;
  }

  .keywords-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .keyword-tag {
    padding: 0.5rem 0.75rem;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 0.875rem;
    border-radius: 9999px;
    border: 1px solid var(--border-color);
  }

  :global(body:has(.popup-backdrop)) {
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .bookmarks-page {
      padding: 1rem;
    }

    .books-container {
      grid-template-columns: 1fr;
    }
    
    .book-card {
      padding: 1rem;
    }

    .empty-state {
      padding: 3rem 1rem;
    }
  }
</style>
