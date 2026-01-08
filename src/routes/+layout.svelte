<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { themeStore } from '$lib/stores/themeStore.svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Nav from '$lib/components/Nav.svelte';
  import AuthModal from '$lib/components/AuthModal.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { onNavigate } from '$app/navigation';

  let { children } = $props();

  let sidebarOpen = $state(false);
  let isWideScreen = $state(false);
  let authModalOpen = $state(false);

  // Add page transition on navigation
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    // Disable transitions on mobile to prevent sidebar flash
    if (!isWideScreen) return;

    // Skip transition if navigating within settings pages
    const fromSettings = navigation.from?.url.pathname.startsWith('/settings');
    const toSettings = navigation.to?.url.pathname.startsWith('/settings');

    if (fromSettings && toSettings) {
      // Both are settings pages, skip transition
      return;
    }

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Track screen size
  function checkWidth() {
    if (!browser) return;
    isWideScreen = window.innerWidth > 700;
    // Open sidebar by default on wide screens
    if (isWideScreen) {
      sidebarOpen = true;
    }
  }

  onMount(() => {
    if (!browser) return;
    checkWidth();
    window.addEventListener('resize', checkWidth);
    chatStore.loadConversations();

    // Initialize theme and language with user's saved preferences
    const settings = $page.data.settings;
    if (settings?.theme) {
      themeStore.initialize(settings.theme);
    }
    if (settings?.language) {
      i18n.initialize(settings.language);
    }

    return () => window.removeEventListener('resize', checkWidth);
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function openAuthModal() {
    authModalOpen = true;
  }

  function closeAuthModal() {
    authModalOpen = false;
  }

  function handleAuthSuccess() {
    // Modal will reload the page automatically
    closeAuthModal();
  }

  // Get user from page data
  let user = $derived($page.data.user);
</script>

<div class="layout">
  <Nav
    {isWideScreen}
    {sidebarOpen}
    onToggle={toggleSidebar}
    onOpenAuth={openAuthModal}
    {user}
  />
  <Sidebar
    {sidebarOpen}
    {isWideScreen}
    onToggle={toggleSidebar}
    onOpenAuth={openAuthModal}
    {user}
  />
  <main
    class="content"
    style="margin-left: {isWideScreen ? (sidebarOpen ? '260px' : '60px') : '0'}"
  >
    <div class="page-wrapper">
      {@render children()}
    </div>
  </main>
</div>

<AuthModal 
  isOpen={authModalOpen}
  onClose={closeAuthModal}
  onSuccess={handleAuthSuccess}
/>

<style>
  :global(html) {
    /* View Transitions API configuration */
    view-transition-name: none;
  }

  .layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-primary);
  }
  
  .content {
    flex: 1;
    transition: margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100vh;
    overflow: hidden;
    padding-top: 3.5rem; /* space for Nav */
  }

  .page-wrapper {
    /* This wrapper animates during page transitions */
    flex: 1;
    overflow: auto;
    view-transition-name: page-content;
  }

  /* Ensure view transition layers stay below sidebar */
  :global(::view-transition-group(page-content)) {
    z-index: 1 !important;
  }

  :global(::view-transition-image-pair(page-content)) {
    z-index: 1 !important;
  }

  :global(::view-transition-old(page-content)) {
    animation: blur-out 0.25s ease-out;
  }
  
  :global(::view-transition-new(page-content)) {
    animation: blur-in 0.25s ease-in;
  }
  
  @keyframes blur-out {
    from {
      opacity: 1;
      filter: blur(0px);
      transform: scale(1);
    }
    to {
      opacity: 0;
      filter: blur(8px);
      transform: scale(0.98);
    }
  }
  
  @keyframes blur-in {
    from {
      opacity: 0;
      filter: blur(8px);
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      filter: blur(0px);
      transform: scale(1);
    }
  }
  
  /* Fallback for browsers without View Transitions API or reduced motion */
  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-old(page-content)),
    :global(::view-transition-new(page-content)) {
      animation: none;
    }
  }
    
  @media (max-width: 700px) {
    .content {
      margin-left: 0 !important;
    }
  }
</style>
