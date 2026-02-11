<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';

  type User = {
    id: string;
    name: string | null;
    email: string | null;
    is_guest: boolean;
    role: 'user' | 'admin';
  };

  let users: User[] = [];
  let expanded: Record<string, boolean> = {};
  let loadingIds: Record<string, boolean> = {};
  let isLoading = true;

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
      users = await res.json();
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  onMount(fetchUsers);

  async function saveUser(user: User) {
    loadingIds[user.id] = true;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err) {
      console.error(err);
    } finally {
      loadingIds[user.id] = false;
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete user ${user.email || user.id}?`)) return;
    loadingIds[user.id] = true;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      users = users.filter(u => u.id !== user.id);
      delete expanded[user.id];
    } catch (err) {
      console.error(err);
    } finally {
      loadingIds[user.id] = false;
    }
  }

  function toggleExpand(id: string) {
    expanded[id] = !expanded[id];
  }
</script>

<div class="users-page">
  <h1>{i18n.t('dashboard.users.title')}</h1>
  
  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else}
    {#each users as user (user.id)}
      <div class="user-card">
        <button class="user-summary" on:click={() => toggleExpand(user.id)}>
          <span>{user.email || `Guest ${user.id}`}</span>
          <span>{expanded[user.id] ? '▲' : '▼'}</span>
        </button>

        {#if expanded[user.id]}
          <div class="user-details">
            <label>
              Name:
              <input type="text" bind:value={user.name} placeholder="Name" />
            </label>

            <label class="checkbox-label">
              <input
                type="checkbox"
                checked={user.role === 'admin'}
                on:change={(e) => user.role = e.currentTarget.checked ? 'admin' : 'user'}
              />
              Is admin
            </label>

            <div class="actions">
              <button on:click={() => saveUser(user)} disabled={loadingIds[user.id]}>
                {loadingIds[user.id] ? 'Saving...' : 'Save'}
              </button>
              <button on:click={() => deleteUser(user)} disabled={loadingIds[user.id]}>
                {loadingIds[user.id] ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .users-page {
    max-width: 800px;
    margin: 2rem auto;
    font-family: system-ui, sans-serif;
    padding: 0 1rem;
  }

  h1 {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .user-card {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
    background: var(--bg-primary);
    transition: box-shadow 0.2s;
  }

  .user-card:hover {
    box-shadow: 0 0 8px rgba(0,0,0,0.1);
  }

  .user-summary {
    width: 100%;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    font-weight: 500;
    background: transparent;
    border: none;
    text-align: left;
    color: var(--text-primary);
  }

  .user-details {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--bg-secondary);
  }

  .user-details label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .checkbox-label {
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    cursor: pointer;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .actions {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }

  .actions button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: var(--primary-color, #4a90e2);
    color: white;
    transition: background 0.2s;
  }

  .actions button:hover:not(:disabled) {
    background: #357ABD;
  }

  .actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
