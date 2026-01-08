<script lang="ts">
  import { onMount } from 'svelte';
  import { X } from '@lucide/svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }
  
  let { isOpen, onClose, onSuccess }: Props = $props();
  
  let mode = $state<'login' | 'register'>('login');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let successMessage = $state('');
  
  function reset() {
    email = '';
    password = '';
    error = '';
    successMessage = '';
    loading = false;
  }
  
  function switchMode() {
    mode = mode === 'login' ? 'register' : 'login';
    reset();
  }
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    successMessage = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || 'Something went wrong';
        loading = false;
        return;
      }
      
      if (data.message) {
        successMessage = data.message;
      }
      
      // Success! Reload page to update user state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
     
    } catch (err) {
      error = 'Network error. Please try again.';
      loading = false;
    }
  }
  
  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
  
  $effect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={handleOverlayClick}
  >
    <div class="modal">
      <button class="close-btn" onclick={onClose} aria-label="Close">
        <X size={20} />
      </button>

      <h2>
        {mode === 'login'
          ? i18n.t('auth.loginHeading')
          : i18n.t('auth.signupHeading')}
      </h2>

      <p class="subtitle">
        {mode === 'login'
          ? i18n.t('auth.loginSubtitle')
          : i18n.t('auth.signupSubtitle')}
      </p>

      {#if error}
        <div class="message error">{error}</div>
      {/if}

      {#if successMessage}
        <div class="message success">{successMessage}</div>
      {/if}

      <form onsubmit={handleSubmit}>
        <div class="form-group">
          <label for="email">{i18n.t('auth.email')}</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="password">{i18n.t('auth.password')}</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            minlength="6"
            disabled={loading}
          />
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
          {loading
            ? i18n.t('auth.pleaseWait')
            : mode === 'login'
              ? i18n.t('auth.loginButton')
              : i18n.t('auth.signupButton')}
        </button>
      </form>

      <div class="switch">
        {mode === 'login'
          ? i18n.t('auth.dontHaveAccount')
          : i18n.t('auth.alreadyHaveAccount')}
        
        <button
          type="button"
          class="link-btn"
          onclick={switchMode}
          disabled={loading}
        >
          {mode === 'login'
            ? i18n.t('auth.signup')
            : i18n.t('auth.login')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px var(--shadow-lg);
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    color: var(--text-tertiary);
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .subtitle {
    margin: 0 0 1.5rem 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .message {
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .message.error {
    background: #f8d7da;
    color: #842029;
    border: 1px solid #f1b0b7;
  }

  .message.success {
    background: #d1e7dd;
    color: #0a3622;
    border: 1px solid #a3cfbb;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  input {
    padding: 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  input:focus {
    outline: none;
    border-color: #4a7dc2;
    box-shadow: 0 0 0 3px rgba(74, 125, 194, 0.1);
  }

  input:disabled {
    background: var(--bg-secondary);
    cursor: not-allowed;
    color: var(--text-tertiary);
  }

  .submit-btn {
    padding: 0.75rem;
    background: #4a7dc2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .submit-btn:hover:not(:disabled) {
    background: #3d6ba8;
  }

  .submit-btn:disabled {
    background: var(--bg-tertiary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .switch {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .link-btn {
    background: none;
    border: none;
    color: #4a7dc2;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    margin-left: 0.25rem;
  }

  .link-btn:hover:not(:disabled) {
    color: #3d6ba8;
  }

  .link-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
