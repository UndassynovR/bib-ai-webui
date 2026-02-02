<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
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
    // Update every second
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
    <h1>Dashboard</h1>
  </div>

  <!-- System -->
  <div class="dashboard-section">
    <h2>System</h2>
    <p class="description">Server information</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">Uptime</span>
        <span class="value uptime">{uptime}</span>
      </div>
    </div>
  </div>

  <!-- Users -->
  <div class="dashboard-section">
    <h2>Users</h2>
    <p class="description">Overview of user accounts</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">Total</span>
        <span class="value">{stats.users.total}</span>
      </div>
      <div class="stat">
        <span class="label">Registered</span>
        <span class="value">{stats.users.registered}</span>
      </div>
      <div class="stat">
        <span class="label">Guests</span>
        <span class="value">{stats.users.guests}</span>
      </div>
    </div>
  </div>

  <!-- Conversations -->
  <div class="dashboard-section">
    <h2>Conversations</h2>
    <p class="description">Chat activity statistics</p>
    
    <div class="stats-row">
      <div class="stat">
        <span class="label">Total</span>
        <span class="value">{stats.conversations.total}</span>
      </div>
    </div>
  </div>

  <!-- Bookmarks -->
  <div class="dashboard-section">
    <h2>Bookmarks</h2>
    <div class="stats-row">
      <div class="stat">
        <span class="label">Total</span>
        <span class="value">{stats.bookmarks.total}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-page {
    max-width: 800px;
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

  .description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
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
