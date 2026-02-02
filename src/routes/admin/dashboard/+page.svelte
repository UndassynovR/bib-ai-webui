<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  
  let { data } = $props();
  const { stats } = data;
  
  let uptime = $state('');
  let interval: ReturnType<typeof setInterval>;
  
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  }
  
  function updateUptime() {
    uptime = formatUptime(stats.uptime.seconds);
  }
  
  onMount(() => {
    updateUptime();
    interval = setInterval(() => {
      stats.uptime.seconds += 1;
      updateUptime();
    }, 1000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="dashboard-page">
  <div class="dashboard-header">
    <h1>{i18n.t('dashboard.title')}</h1>
  </div>

  <!-- System Health -->
  <div class="dashboard-section">
    <h2>{i18n.t('dashboard.systemHealth.title')}</h2>
    <p class="description">{i18n.t('dashboard.systemHealth.description')}</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">{i18n.t('dashboard.systemHealth.uptime')}</span>
        <span class="value uptime">{uptime}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.systemHealth.apiPing')}</span>
        <span class="value">{stats.system.apiPing >= 0 ? `${stats.system.apiPing}ms` : i18n.t('dashboard.systemHealth.error')}</span>
      </div>
    </div>
  </div>

  <!-- Users -->
  <div class="dashboard-section">
    <h2>{i18n.t('dashboard.users.title')}</h2>
    <p class="description">{i18n.t('dashboard.users.description')}</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">{i18n.t('dashboard.users.total')}</span>
        <span class="value">{stats.users.total}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.users.registered')}</span>
        <span class="value">{stats.users.registered}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.users.guests')}</span>
        <span class="value">{stats.users.guests}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.users.active')}</span>
        <span class="value">{stats.users.active}</span>
      </div>
    </div>

    <div class="subsection">
      <h3>{i18n.t('dashboard.users.newUsers')}</h3>
      <div class="stats-row">
        <div class="stat">
          <span class="label">{i18n.t('dashboard.users.today')}</span>
          <span class="value">{stats.users.newToday}</span>
        </div>
        <div class="stat">
          <span class="label">{i18n.t('dashboard.users.thisWeek')}</span>
          <span class="value">{stats.users.newThisWeek}</span>
        </div>
        <div class="stat">
          <span class="label">{i18n.t('dashboard.users.thisMonth')}</span>
          <span class="value">{stats.users.newThisMonth}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Conversations -->
  <div class="dashboard-section">
    <h2>{i18n.t('dashboard.conversations.title')}</h2>
    <p class="description">{i18n.t('dashboard.conversations.description')}</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">{i18n.t('dashboard.conversations.total')}</span>
        <span class="value">{stats.conversations.total}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.conversations.today')}</span>
        <span class="value">{stats.conversations.today}</span>
      </div>
      <div class="stat">
        <span class="label">{i18n.t('dashboard.conversations.thisWeek')}</span>
        <span class="value">{stats.conversations.thisWeek}</span>
      </div>
    </div>
  </div>

  <!-- Bookmarks -->
  <div class="dashboard-section">
    <h2>{i18n.t('dashboard.bookmarks.title')}</h2>
    <div class="stats-row">
      <div class="stat">
        <span class="label">{i18n.t('dashboard.bookmarks.total')}</span>
        <span class="value">{stats.bookmarks.total}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  .dashboard-header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .dashboard-section {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    color: var(--text-primary);
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    color: var(--text-primary);
  }

  .description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .subsection {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .stats-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .stat {
    min-width: 120px;
  }

  .label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .uptime {
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    .dashboard-page {
      padding: 1rem;
    }

    .stats-row {
      gap: 1rem;
    }

    .value {
      font-size: 1.25rem;
    }
  }
</style>
