<script lang="ts">
  import { page } from '$app/stores';
  import { LogOut, Mail } from '@lucide/svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
 
  let user = $derived($page.data.user);
  let isLoggingOut = $state(false);
 
  async function handleLogout() {
    if (isLoggingOut) return;
     
    isLoggingOut = true;
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      isLoggingOut = false;
    }
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h1>{i18n.t('settings.accountTitle')}</h1>
  </div>

  <div class="settings-section">
    <h2>{i18n.t('settings.accountInformation')}</h2>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">
          <Mail size={18} />
          <span>{i18n.t('settings.accountEmail')}</span>
        </div>
        <div class="info-value">
          {user?.email || i18n.t('settings.notSet')}
        </div>
      </div>
    </div>
  </div>

  <div class="settings-section">
    <h2>{i18n.t('settings.accountActions')}</h2>
    <p class="section-description">
      {i18n.t('settings.accountActionsDescription')}
    </p>

    <button
      class="logout-btn"
      onclick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut size={18} />
      <span>
        {isLoggingOut
          ? i18n.t('settings.loggingOut')
          : i18n.t('settings.logout')}
      </span>
    </button>
  </div>
</div>

<style>
  .settings-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .settings-header {
    margin-bottom: 2rem;
  }

  .settings-header h1 {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .settings-section {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-section h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }

  .section-description {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--bg-tertiary);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .info-value {
    font-weight: 500;
    color: var(--text-primary);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }

  .logout-btn:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .logout-btn:disabled {
    background: var(--bg-secondary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .settings-page {
      padding: 1rem;
    }
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
