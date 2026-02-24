<script lang="ts">
  import { Trash } from '@lucide/svelte';

  interface Props {
    id: string;
    title: string;
    isActive?: boolean;
    onDelete: () => void;
  }

  let { id, title, isActive = false, onDelete }: Props = $props();

  // ── Desktop delete (hover trash click) ─────────────────────────────────────
  function kill(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    showDialog = true;
  }

  // ── Delete confirmation dialog ──────────────────────────────────────────────
  let showDialog = $state(false);

  function confirmDelete() {
    showDialog = false;
    onDelete();
  }

  // ── Long-press for mobile ───────────────────────────────────────────────────
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let didLongPress = false;

  function onTouchStart(e: TouchEvent) {
    didLongPress = false;
    longPressTimer = setTimeout(() => {
      didLongPress = true;
      showDialog = true;
      navigator.vibrate?.(40);
    }, 500);
  }

  function onTouchMove() {
    // Finger moved = scrolling, cancel the press
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    // Suppress the tap navigation that follows a long press
    if (didLongPress) {
      e.preventDefault();
    }
  }
</script>

<a
  href="/c/{id}"
  class="item"
  class:active={isActive}
  title={title}
  data-sveltekit-noscroll
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
>
  <span class="label">{title}</span>

  <button class="trash" onclick={kill} type="button" aria-label="Delete">
    <Trash size={16} />
  </button>
</a>

{#if showDialog}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dialog-backdrop" role="presentation" onclick={() => showDialog = false}>
    <div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <p class="dialog-title">Delete this chat?</p>
      <p class="dialog-sub">"{title}"</p>
      <div class="dialog-actions">
        <button class="btn-cancel" onclick={() => showDialog = false}>Cancel</button>
        <button class="btn-delete" onclick={confirmDelete}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .item {
    width: 100%;
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--text-primary);
    transition: background 0.2s ease, color 0.2s ease;
    overflow: hidden;
    position: relative;
  }

  .item:hover {
    background: var(--bg-tertiary);
  }

  .item.active {
    background: var(--border-color-hover);
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trash {
    opacity: 0;
    pointer-events: none;
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s ease, transform 0.12s ease, color 0.2s ease;
    color: var(--text-secondary);
    border-radius: 6px;
  }

  .item:hover .trash {
    opacity: 1;
    pointer-events: auto;
  }

  .trash:hover {
    color: rgb(220, 38, 38);
    transform: scale(1.12);
  }

  /* Prevent iOS callout / text selection on long press */
  .item {
    -webkit-touch-callout: none;
    user-select: none;
  }

  /* Hide hover trash on touch devices — long press handles delete instead */
  @media (hover: none) {
    .trash {
      display: none;
    }
  }

  /* ── Delete confirmation dialog ── */
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 2000;
    display: flex;
    align-items: flex-end; /* bottom sheet on mobile */
    justify-content: center;
    padding: 1rem;
  }

  @media (min-width: 701px) {
    .dialog-backdrop {
      align-items: center; /* centred modal on desktop */
    }
  }

  .dialog {
    background: var(--bg-secondary);
    border-radius: 1rem;
    padding: 1.5rem;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .dialog-title {
    font-weight: 600;
    font-size: 1rem;
    margin: 0 0 0.25rem;
    color: var(--text-primary);
  }

  .dialog-sub {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0 0 1.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-delete {
    padding: 0.5rem 1.25rem;
    border-radius: 0.5rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-cancel {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .btn-cancel:hover {
    background: var(--border-color);
  }

  .btn-delete {
    background: rgb(220, 38, 38);
    color: #fff;
  }

  .btn-delete:hover {
    background: rgb(185, 28, 28);
  }
</style>
