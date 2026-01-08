<script lang="ts">
  import { Trash } from '@lucide/svelte';

  interface Props {
    id: string;
    title: string;
    isActive?: boolean;
    onDelete: () => void;
  }

  let { id, title, isActive = false, onDelete }: Props = $props();

  function kill(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  }
</script>

<a
  href="/c/{id}"
  class="item"
  class:active={isActive}
  title={title}
  data-sveltekit-noscroll
>
  <span class="label">{title}</span>
  
  <button class="trash" onclick={kill} type="button" aria-label="Delete">
    <Trash size={16} />
  </button>
</a>

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
</style>
