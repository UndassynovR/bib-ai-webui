<script lang="ts">
  import { Moon, Sun, Monitor } from '@lucide/svelte';
  import { themeStore } from '$lib/stores/themeStore.svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  import { onMount } from 'svelte';

  let theme = $state<'light' | 'dark' | 'system'>('system');
  let language = $state<'auto' | 'en' | 'ru' | 'kk'>('auto');
  let loading = $state(false);
  let saveMessage = $state('');

  const themes = [
    { value: 'system', get label() { return i18n.t('settings.themeSystem'); }, icon: Monitor },
    { value: 'light', get label() { return i18n.t('settings.themeLight'); }, icon: Sun },
    { value: 'dark', get label() { return i18n.t('settings.themeDark'); }, icon: Moon }
  ] as const;

  const languages = [
    { value: 'auto', get label() { return i18n.t('settings.languageAuto'); } },
    { value: 'en', get label() { return i18n.t('settings.languageEnglish'); } },
    { value: 'ru', get label() { return i18n.t('settings.languageRussian'); } },
    { value: 'kk', get label() { return i18n.t('settings.languageKazakh'); } }
  ] as const;

  onMount(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        theme = data.theme || 'system';
        language = data.language || 'auto';
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  });

  async function selectTheme(v: string) {
    const newTheme = v as 'light' | 'dark' | 'system';
    theme = newTheme;
    loading = true;
    saveMessage = '';
    try {
      await themeStore.setTheme(newTheme);
      // success—do nothing
    } catch (err) {
      console.error('Failed to save theme:', err);
      saveMessage = i18n.t('settings.saveFailed');
    } finally {
      loading = false;
    }
  }

  async function selectLanguage(v: string) {
    const newLanguage = v as 'auto' | 'en' | 'ru' | 'kk';
    language = newLanguage;
    loading = true;
    saveMessage = '';
    try {
      await i18n.setLanguage(newLanguage);
      // success—do nothing
    } catch (err) {
      console.error('Failed to save language:', err);
      saveMessage = i18n.t('settings.saveFailed');
    } finally {
      loading = false;
    }
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h1>{i18n.t('settings.generalTitle')}</h1>
    {#if saveMessage}
      <div class="save-message error">
        {saveMessage}
      </div>
    {/if}
  </div>

  <!-- Appearance -->
  <div class="settings-section">
    <div class="section-row">
      <div>
        <h2>{i18n.t('settings.appearance')}</h2>
        <p class="description">{i18n.t('settings.appearanceDescription')}</p>
      </div>
      <select
        class="dropdown"
        bind:value={theme}
        onchange={(e) => selectTheme(e.currentTarget.value)}
        disabled={loading}
      >
        {#each themes as t}
          <option value={t.value}>{t.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Language -->
  <div class="settings-section">
    <div class="section-row">
      <div>
        <h2>{i18n.t('settings.language')}</h2>
        <p class="description">{i18n.t('settings.languageDescription')}</p>
      </div>
      <select
        class="dropdown"
        bind:value={language}
        onchange={(e) => selectLanguage(e.currentTarget.value)}
        disabled={loading}
      >
        {#each languages as l}
          <option value={l.value}>{l.label}</option>
        {/each}
      </select>
    </div>
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
  position: relative;
}

h1 {
  font-size: 1.875rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.save-message {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.settings-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.dropdown {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 150px;
}

.dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .section-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .dropdown {
    width: 100%;
  }
}
</style>
