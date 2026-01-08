<script lang="ts">
  import { PanelLeft, LogOut } from '@lucide/svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
 
  interface Props {
    isWideScreen: boolean;
    sidebarOpen: boolean;
    onToggle: () => void;
    onOpenAuth: () => void;
    user?: {
      id: string;
      email: string | null;
      name: string | null;
      is_guest: boolean;
    };
  }
  
  let { isWideScreen, sidebarOpen, onToggle, onOpenAuth, user }: Props = $props();
  
  // Calculate nav left position based on sidebar state
  let navLeft = $derived(
    isWideScreen ? (sidebarOpen ? '260px' : '60px') : '0'
  );
</script>

<nav class="nav" style="left: {navLeft}; border-bottom: {isWideScreen ? 'none' : '1px solid rgba(13, 13, 13, 0.05)'}">
  {#if !isWideScreen}
    <button class="nav-toggle" onclick={onToggle} aria-label="Toggle sidebar">
      <PanelLeft size={20} />
    </button>
  {/if}
  
  <div class="nav-title">
    <h1>{i18n.t('nav.chat')}</h1>
  </div>
  
  <div class="nav-actions">
    {#if user?.is_guest}
      <button class="auth-btn signin" onclick={onOpenAuth}>
        {i18n.t('nav.login')}
      </button>
    {/if}
  </div>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    right: 0;
    height: 3.5rem;
    background: var(--bg-primary);
    display: flex;
    align-items: center;
    padding: 0 1rem;
    z-index: 50;
    gap: 1rem;
    transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                background 0.2s ease,
                color 0.2s ease;
  }

  .nav-toggle {
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, color 0.2s ease;
    color: var(--text-primary);
  }

  .nav-toggle:hover {
    background: var(--bg-tertiary);
  }

  .nav-title {
    flex: 1;
  }

  .nav-title h1 {
    font-size: 0.95rem;   /* was 1.125rem */
    font-weight: 500;    /* was 600 */
    line-height: 1.2;
    margin: 0;
    color: var(--text-secondary);
  }

  .nav-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .auth-btn {
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease, color 0.2s ease, background 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-btn.signin {
    padding: 0.5rem 1rem;
    background: var(--text-primary);
    color: var(--bg-primary);
  }

  .auth-btn.signin:hover {
    background: var(--text-secondary);
  }
</style>
