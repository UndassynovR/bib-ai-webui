<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { BookOpenText, Calendar, Building, MapPin, Hash, Tag, X, Loader2, AlertCircle, AlertTriangle, Bookmark } from '@lucide/svelte';
  import { bookmarkStore } from '$lib/stores/bookmarkStore.svelte';

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

  export let book: Book;
  export let onClose: () => void;

  // Reactive bookmark state
  $: bookmarkedIds = bookmarkStore.bookmarks;

  function getAuthors(book: Book): string {
    return [book.author, book.other_authors]
      .filter(Boolean)
      .join(', ') || 'Автор не указан';
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
  class="popup-backdrop"
  onclick={onClose}
  transition:fade={{ duration: 200 }}
  role="presentation"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
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
          {book.title || 'Без названия'}
        </h2>
        <p class="modal-subtitle">{getAuthors(book)}</p>
      </div>
      <div class="header-actions">
        <button
          onclick={(e) => handleBookmarkClick(book.DOC_ID, e)}
          class="bookmark-button"
          aria-label={bookmarkStore.isBookmarked(book.DOC_ID) ? 'Удалить из закладок' : 'Добавить в закладки'}
        >
          <Bookmark 
            size={24}
            fill={bookmarkedIds.includes(book.DOC_ID) ? 'currentColor' : 'none'}
          />
        </button>
        <button
          onclick={onClose}
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
                    
        {#await fetch(`/api/descriptions/${book.DOC_ID}`).then(r => r.json())}
          <div class="loading-state">
            <Loader2 class="spinner" size={32} />
            <span class="loading-text">Загрузка описания, это может занять некоторое время</span>
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
                              
          {#if book.year}
            <div class="detail-item">
              <Calendar size={20} />
              <div>
                <p class="detail-label">Год издания</p>
                <p class="detail-value">{book.year}</p>
              </div>
            </div>
          {/if}
          
          {#if book.publisher}
            <div class="detail-item">
              <Building size={20} />
              <div>
                <p class="detail-label">Издательство</p>
                <p class="detail-value">{book.publisher}</p>
              </div>
            </div>
          {/if}
          
          {#if book.publication_place}
            <div class="detail-item">
              <MapPin size={20} />
              <div>
                <p class="detail-label">Место издания</p>
                <p class="detail-value">{book.publication_place}</p>
              </div>
            </div>
          {/if}
          
          {#if book.isbn}
            <div class="detail-item">
              <Hash size={20} />
              <div>
                <p class="detail-label">ISBN</p>
                <p class="detail-value isbn">{book.isbn}</p>
              </div>
            </div>
          {/if}
          
          {#if book.keywords}
            <div class="detail-item keywords-item">
              <Tag size={20} />
              <div class="flex-1">
                <p class="detail-label">Ключевые слова</p>
                <div class="keywords-container">
                  {#each book.keywords.split(',') as keyword}
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

<style>
  /* Popup Styles */
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
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bookmark-button {
    flex-shrink: 0;
    color: var(--text-tertiary);
    transition: all 0.3s ease;
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bookmark-button:hover {
    color: #4a7dc2;
    transform: scale(1.1);
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
    margin-left: 0.75rem;
    color: var(--text-secondary);
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
</style>
