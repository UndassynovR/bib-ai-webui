<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';

  let { children } = $props();

  function navigate(path: string) {
    goto(`/settings/${path}`);
  }

  // Create reactive menu that updates when language changes
  // $derived will automatically track i18n.locale changes
  let menu = $derived([
    { name: i18n.t('settings.general'), path: 'general' },
    { name: i18n.t('settings.account'), path: 'account' }
  ]);
</script>

<div class="settings-layout">
  <nav class="vertical-menu">
    {#each menu as item}
      <button
        class:active={$page.url.pathname.endsWith(item.path)}
        onclick={() => navigate(item.path)}
      >
        {item.name}
      </button>
    {/each}
  </nav>

  <section class="settings-content">
    {@render children()}
  </section>
</div>

<style>
  .settings-layout {
    display: flex;
    height: 100%;
  }

  .vertical-menu {
    width: 200px;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .vertical-menu button {
    padding: 1rem;
    cursor: pointer;
    background: none;
    border: none;
    text-align: left;
    color: var(--text-primary);
    transition: background-color 0.2s;
  }

  .vertical-menu button:hover {
    background-color: var(--bg-secondary);
  }

  .vertical-menu button.active {
    background-color: var(--bg-tertiary);
    font-weight: bold;
  }

  .settings-content {
    flex: 1;
    padding: 1rem;
    overflow: auto;
  }

  /* Mobile adaptation */
  @media (max-width: 700px) {
    .settings-layout {
      flex-direction: column;
    }

    .vertical-menu {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
      flex-direction: row;
      overflow-x: auto;
    }

    .vertical-menu button {
      padding: 0.75rem 1rem;
      white-space: nowrap;
      flex-shrink: 0;
      text-align: center;
      border-bottom: 2px solid transparent;
    }

    .vertical-menu button.active {
      border-bottom-color: var(--primary-color, #4a90e2);
      background-color: transparent;
    }

    .settings-content {
      padding: 1rem 0.75rem;
    }
  }
</style>
