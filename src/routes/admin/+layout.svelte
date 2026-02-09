<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';

  let { children } = $props();

  function navigate(path: string) {
    goto(`/admin/${path}`);
  }

  const menu = [
    { name: i18n.t('dashboard.title'), path: 'dashboard' },
    { name: i18n.t('dashboard.users.title'), path: 'users' }
  ];
</script>

<div class="admin-layout">
  <nav class="vertical-menu">
    {#each menu as item}
      <button
        class="menu-item"
        class:active={$page.url.pathname.endsWith(item.path)}
        onclick={() => navigate(item.path)}
      >
        {item.name}
      </button>
    {/each}
  </nav>

  <section class="admin-content">
    {@render children()}
  </section>
</div>

<style>
  .admin-layout {
    display: flex;
    height: 100%;
  }

  .vertical-menu {
    width: 220px;
    border-right: 1px solid var(--border-color);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-shrink: 0;
    /* background: var(--bg-secondary); */
  }

  .menu-item {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    text-align: left;
    color: var(--text-primary);
    transition: background 0.15s;
  }

  .menu-item:hover {
    background: var(--bg-tertiary);
  }

  .menu-item.active {
    background: var(--bg-tertiary);
    font-weight: 500;
  }

  .admin-content {
    flex: 1;
    padding: 1rem;
    overflow: auto;
  }

  @media (max-width: 700px) {
    .admin-layout {
      flex-direction: column;
    }

    .vertical-menu {
      width: 100%;
      flex-direction: row;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .menu-item {
      white-space: nowrap;
      text-align: center;
    }

    .menu-item.active {
      background: transparent;
      border-bottom: 2px solid var(--primary-color, #4a90e2);
      border-radius: 0;
    }

    .admin-content {
      padding: 0.75rem;
    }
  }
</style>
