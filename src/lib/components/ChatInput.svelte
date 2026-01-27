<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';

  interface Props {
    onSubmit: (message: string) => void;
    disabled?: boolean;
  }

  let { onSubmit, disabled = false }: Props = $props();

  let prompt = $state("");
  let isMultiline = $state(false);
  let textarea: HTMLTextAreaElement;

  function autoResize(event: Event) {
    const t = event.target as HTMLTextAreaElement;
    requestAnimationFrame(() => {
      t.style.height = "auto";
      t.style.height = t.scrollHeight + "px";
      isMultiline = t.scrollHeight > 40;
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(new Event('submit'));
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!prompt.trim() || disabled) return;

    onSubmit(prompt.trim());
    prompt = "";

    if (textarea) {
      textarea.style.height = "auto";
      isMultiline = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <div class="input-container">
    <textarea
      bind:this={textarea}
      bind:value={prompt}
      placeholder={i18n.t('input.placeholder')}
      rows="1"
      oninput={autoResize}
      onkeydown={handleKeyDown}
      {disabled}
    ></textarea>

    <button
      type="submit"
      class="icon-btn submit-btn"
      class:multiline={isMultiline}
      disabled={!prompt.trim() || disabled}
      aria-label={i18n.t('input.send')}
      data-tooltip={i18n.t('input.sendHint')}
    >
      <ChevronRight size={18} />
    </button>
  </div>
</form>

<style>
  form {
    width: 100%;
    background: transparent;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 1.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg-primary);
    transition: border-color 0.15s, box-shadow 0.15s, background 0.2s ease;
  }

  .input-container:focus-within {
    border-color: var(--border-color-hover);
    box-shadow: 0 0 0 3px var(--shadow-sm);
  }

  textarea {
    flex: 1;
    border: none;
    outline: none;
    font: inherit;
    font-size: 0.9375rem;
    line-height: 1.5;
    padding: 0.375rem 0;
    resize: none;
    max-height: 200px;
    overflow-y: auto;
    background: transparent;
    min-height: 1.5em;
    box-sizing: border-box;
    color: var(--text-primary);
  }

  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  textarea::placeholder {
    color: var(--text-tertiary);
  }

  .icon-btn {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 0.5rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    flex-shrink: 0;
  }

  .submit-btn {
    background: var(--text-primary);
    color: var(--bg-primary);
    border-radius: 50%;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--text-secondary);
    transform: scale(1.05);
  }

  .submit-btn:disabled {
    background: var(--border-color);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }

  .icon-btn::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    margin-bottom: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--text-primary);
    color: var(--bg-primary);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 1000;
  }

  .icon-btn:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  @media (max-width: 700px) {
    .input-container {
      border-radius: 1.25rem;
      padding: 0.5rem;
    }

    textarea {
      font-size: 1rem;
    }
  }
</style>
