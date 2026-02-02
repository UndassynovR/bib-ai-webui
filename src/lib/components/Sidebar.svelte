<script lang="ts">
  import { PanelLeft, MessageCirclePlus, BookMarked, CircleUser, Search, Wrench, Settings, LogOut } from '@lucide/svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import ConversationItem from './ConversationItem.svelte';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  
  import ChatSearchPopup from './ChatSearchPopup.svelte';
  let showSearch = $state(false);
  
  interface Props {
    sidebarOpen: boolean;
    isWideScreen: boolean;
    onToggle: () => void;
    onOpenAuth: () => void;
    user?: {
      id: string;
      email: string | null;
      name: string | null;
      is_guest: boolean;
	  role: string;
    };
  }
  
  let {
    sidebarOpen,
    isWideScreen,
    onToggle,
    onOpenAuth,
    user,
  }: Props = $props();
  
  // Get data directly from store
  let conversations = $derived(chatStore.conversations ?? []);
  let activeId = $derived(chatStore.activeConversationId);
  
  // Handle delete
  async function handleDelete(id: string) {
    await chatStore.deleteConversation(id);
    // If we deleted the active conversation, go home
    if (id === activeId) {
      goto('/');
    }
  }
  
  function goHome() {
    goto('/');
  }

  function goToAdminDashboard() {
    goto('/admin/dashboard');
  }
  
  function goToSettings() {
    goto('/settings/general');
  }
  
  function goToBookmarks() {
    goto('/bookmarks');
  }
  
  function handleAccountClick() {
    if (user?.is_guest) {
      // Open auth modal for guests
      onOpenAuth();
    } else {
      // Go to account settings for registered users
      goto('/settings/account');
    }
  }
  
  async function handleLogout() {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
  
  let displayName = $derived(
    user?.is_guest 
      ? 'Guest' 
      : user?.name || user?.email || 'User'
  );
</script>

<aside
  class="sidebar"
  class:open={sidebarOpen}
  class:minimized={!sidebarOpen && isWideScreen}
  class:hidden={!sidebarOpen && !isWideScreen}
>
  <div class="sidebar-content">
    {#if isWideScreen}
      <div class="header-section">
        <button
          class="logo-wrapper"
          onclick={onToggle}
          aria-label="Logo"
        >
          <img src="/logo.svg" alt="Logo" class="logo" />
        </button>
        {#if sidebarOpen}
          <button
            class="toggle-btn"
            onclick={onToggle}
            aria-label={i18n.t('sidebar.toggle')}
          >
            <div class="icon-wrapper">
              <PanelLeft size={20} />
            </div>
          </button>
        {/if}
      </div>
      <div class="separator"></div>
    {/if}
    
    <div class="main-section">
      <button
        class="sidebar-item"
        aria-label={i18n.t('sidebar.newChat')}
        data-tooltip={i18n.t('sidebar.newChat')}
        onclick={goHome}
      >
        <div class="icon-wrapper">
          <MessageCirclePlus size={20} />
        </div>
        {#if sidebarOpen}
          <span class="label">{i18n.t('sidebar.newChat')}</span>
        {/if}
      </button>
      
      <button
        class="sidebar-item"
        aria-label={i18n.t('sidebar.searchChats')}
        data-tooltip={i18n.t('sidebar.searchChats')}
        onclick={() => showSearch = true}
      >
        <div class="icon-wrapper">
          <Search size={20} />
        </div>
        {#if sidebarOpen}
          <span class="label">{i18n.t('sidebar.searchChats')}</span>
        {/if}
      </button>
      
      <button
        class="sidebar-item"
        aria-label={i18n.t('sidebar.bookmarks')}
        data-tooltip={i18n.t('sidebar.bookmarks')}
        onclick={goToBookmarks}
      >
        <div class="icon-wrapper">
          <BookMarked size={20} />
        </div>
        {#if sidebarOpen}
          <span class="label">{i18n.t('sidebar.bookmarks')}</span>
        {/if}
      </button>
    </div>
    
    {#if sidebarOpen}
      <div class="chat-list-label">
        {i18n.t('sidebar.yourChats')}
      </div>
      <div class="chat-list">
        {#each conversations as c}
          <ConversationItem
            id={c.id}
            title={c.title}
            isActive={c.id === activeId}
            onDelete={() => handleDelete(c.id)}
          />
        {/each}
      </div>
    {/if}
    
    <div class="bottom-section">
      {#if user?.role == 'admin'}
        <button
          class="sidebar-item admin-btn"
          aria-label="Admin dashboard"
          data-tooltip="Admin dashboard"
          onclick={goToAdminDashboard}
        >
          <div class="icon-wrapper">
            <Wrench size={20} />
          </div>
          {#if sidebarOpen}
            <span class="label">{i18n.t('sidebar.admin')}</span>
          {/if}
        </button>
      {/if}

      <button
        class="sidebar-item settings-btn"
        aria-label={i18n.t('sidebar.settings')}
        data-tooltip={i18n.t('sidebar.settings')}
        onclick={goToSettings}
      >
        <div class="icon-wrapper">
          <Settings size={20} />
        </div>
        {#if sidebarOpen}
          <span class="label">{i18n.t('sidebar.settings')}</span>
        {/if}
      </button>
      
      <button
        class="sidebar-item account-btn"
        aria-label={
          user?.is_guest
            ? i18n.t('sidebar.guestAccount')
            : i18n.t('sidebar.account')
        }
        data-tooltip={
          user?.is_guest
            ? i18n.t('sidebar.guestAccount')
            : i18n.t('sidebar.accountSettings')
        }
        onclick={handleAccountClick}
      >
        <div class="icon-wrapper avatar">
          <CircleUser size={20} />
        </div>
        {#if sidebarOpen}
          <span class="label">{displayName}</span>
        {/if}
      </button>
    </div>
  </div>
  
  {#if !isWideScreen && sidebarOpen}
    <button
      class="mobile-close"
      onclick={onToggle}
      aria-label={i18n.t('sidebar.close')}
    >
      <PanelLeft size={20} />
    </button>
  {/if}
</aside>

{#if !isWideScreen && sidebarOpen}
  <button
    class="overlay"
    onclick={onToggle}
    aria-label={i18n.t('sidebar.close')}
  ></button>
{/if}

{#if showSearch}
  <ChatSearchPopup onClose={() => showSearch = false} />
{/if}

<style>
  .sidebar {
    width: 260px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.2s ease;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
  }

  .sidebar.minimized {
    width: 60px;
    background: var(--bg-primary);
  }

  .sidebar.hidden {
    transform: translateX(-100%);
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0.5rem;
  }

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 2rem;
    position: relative;
    min-height: 2rem;
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    width: 2.5rem;
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background 0.15s;
    position: relative;
    overflow: visible;
  }

  .logo-wrapper:hover {
    background: var(--bg-tertiary);
  }

  .logo {
    height: 42px;
    width: auto;
    object-fit: contain;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.15s, opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--text-primary);
    height: 2rem;
    width: 2.5rem;
    opacity: 0;
    transform: translateX(-10px);
  }

  .sidebar.open .toggle-btn {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.1s;
  }

  .toggle-btn:hover {
    background: var(--bg-tertiary);
  }

  .separator { 
    height: 1rem; 
  }

  .main-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bottom-section {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.15s;
    color: var(--text-primary);
    width: 100%;
    text-align: left;
    height: 2rem;
    position: relative;
    overflow: visible;
  }

  .sidebar-item:hover {
    background: var(--bg-tertiary);
  }

  .sidebar-item:hover .icon-wrapper {
    transform: translateX(3px) rotate(8deg);
  }

  .settings-btn:hover .icon-wrapper { transform: rotate(90deg); }
  .account-btn:hover .icon-wrapper { transform: none; }

  .sidebar.minimized .sidebar-item::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--text-primary);
    color: var(--bg-primary);
    border-radius: 0.375rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 1000;
  }

  .sidebar.minimized .sidebar-item:hover::after {
    opacity: 1;
    transform: translateY(-50%) translateX(4px);
  }

  .sidebar.minimized .sidebar-item::before {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0.25rem;
    border: 4px solid transparent;
    border-right-color: var(--text-primary);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .sidebar.minimized .sidebar-item:hover::before {
    opacity: 1;
  }

  .icon-wrapper {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    animation: fadeIn 0.2s ease-in forwards;
    animation-delay: 0.1s;
    color: var(--text-primary);
  }

  .chat-list-label {
    padding: 0.4rem 0 0 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    opacity: 0;
    animation: fadeIn 0.2s ease-in forwards;
    animation-delay: 0.1s;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .mobile-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    color: var(--text-secondary);
  }

  .mobile-close:hover {
    background: var(--bg-tertiary);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .chat-list {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .chat-list::-webkit-scrollbar {
    width: 6px;
  }

  .chat-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  .chat-list::-webkit-scrollbar-thumb:hover {
    background: var(--border-color-hover);
  }

  .chat-list {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
  }

  @media (min-width: 701px) {
    .mobile-close,
    .overlay {
      display: none;
    }
  }
</style>
