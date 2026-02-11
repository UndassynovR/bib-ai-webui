<script lang="ts">
  import { i18n } from '$lib/stores/i18nStore.svelte';

  let openaiKey = $state('');
  let openaiStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let openaiError = $state('');

  let ldapUrl = $state('');
  let ldapBaseDn = $state('');
  let ldapAdminLogin = $state('');
  let ldapAdminPassword = $state('');
  let ldapCertFile = $state<File | null>(null);
  let ldapStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let ldapError = $state('');

  let libraryDbHost = $state('');
  let libraryDbPort = $state('1433');
  let libraryDbName = $state('');
  let libraryDbUser = $state('');
  let libraryDbPassword = $state('');
  let libraryDbStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let libraryDbError = $state('');

  let loading = $state(false);

  let libraryDbUrl = $derived(libraryDbHost && libraryDbName && libraryDbUser && libraryDbPassword
    ? `mssql://${libraryDbUser}:${libraryDbPassword}@${libraryDbHost}${libraryDbPort ? ':' + libraryDbPort : ''}/${libraryDbName}?encrypt=true&trustServerCertificate=true`
    : '');

  async function testOpenAI() {
    openaiStatus = 'testing';
    openaiError = '';

    try {
      const response = await fetch('/api/admin/settings/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openaiKey })
      });

      const data = await response.json();

      if (response.ok) {
        openaiStatus = 'success';
      } else {
        openaiStatus = 'error';
        openaiError = data.error || 'Connection failed';
      }
    } catch (error) {
      openaiStatus = 'error';
      openaiError = 'Network error';
    }
  }

  async function testLDAP() {
    ldapStatus = 'testing';
    ldapError = '';

    try {
      const formData = new FormData();
      formData.append('url', ldapUrl);
      formData.append('baseDn', ldapBaseDn);
      formData.append('adminLogin', ldapAdminLogin);
      formData.append('adminPassword', ldapAdminPassword);
      if (ldapCertFile) {
        formData.append('certificate', ldapCertFile);
      }

      const response = await fetch('/api/admin/settings/test-ldap', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        ldapStatus = 'success';
      } else {
        ldapStatus = 'error';
        ldapError = data.error || 'Connection failed';
      }
    } catch (error) {
      ldapStatus = 'error';
      ldapError = 'Network error';
    }
  }

  async function testLibraryDb() {
    libraryDbStatus = 'testing';
    libraryDbError = '';

    try {
      const response = await fetch('/api/admin/settings/test-library-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: libraryDbHost,
          port: libraryDbPort,
          database: libraryDbName,
          user: libraryDbUser,
          password: libraryDbPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        libraryDbStatus = 'success';
      } else {
        libraryDbStatus = 'error';
        libraryDbError = data.error || 'Connection failed';
      }
    } catch (error) {
      libraryDbStatus = 'error';
      libraryDbError = 'Network error';
    }
  }

  async function saveSettings() {
    loading = true;

    try {
      const formData = new FormData();
      formData.append('openaiKey', openaiKey);
      formData.append('ldapUrl', ldapUrl);
      formData.append('ldapBaseDn', ldapBaseDn);
      formData.append('ldapAdminLogin', ldapAdminLogin);
      formData.append('ldapAdminPassword', ldapAdminPassword);
      formData.append('libraryDbHost', libraryDbHost);
      formData.append('libraryDbPort', libraryDbPort);
      formData.append('libraryDbName', libraryDbName);
      formData.append('libraryDbUser', libraryDbUser);
      formData.append('libraryDbPassword', libraryDbPassword);
      if (ldapCertFile) {
        formData.append('ldapCertificate', ldapCertFile);
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Settings saved successfully');
      } else {
        const data = await response.json();
        alert('Failed to save settings: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error');
    } finally {
      loading = false;
    }
  }

  function handleCertUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      ldapCertFile = input.files[0];
    }
  }

  // Load current settings on mount
  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        openaiKey = data.openaiKey || '';
        ldapUrl = data.ldapUrl || '';
        ldapBaseDn = data.ldapBaseDn || '';
        ldapAdminLogin = data.ldapAdminLogin || '';
        ldapAdminPassword = data.ldapAdminPassword || '';
        libraryDbHost = data.libraryDbHost || '';
        libraryDbPort = data.libraryDbPort || '1433';
        libraryDbName = data.libraryDbName || '';
        libraryDbUser = data.libraryDbUser || '';
        libraryDbPassword = data.libraryDbPassword || '';
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  $effect(() => {
    loadSettings();
  });
</script>

<div class="settings-page">
  <h1>{i18n.t('dashboard.settings.title')}</h1>

  <!-- OpenAI Settings -->
  <section class="settings-section">
    <h2>OpenAI API</h2>
    
    <div class="form-group">
      <label for="openai-key">API Key</label>
      <div class="input-with-button">
        <input
          id="openai-key"
          type="password"
          bind:value={openaiKey}
          placeholder="sk-proj-1a2b3c4d5e6f7g8h9i0j..."
          disabled={loading}
        />
        <button
          type="button"
          class="test-btn"
          onclick={testOpenAI}
          disabled={!openaiKey || openaiStatus === 'testing'}
        >
          {openaiStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      
      {#if openaiStatus === 'success'}
        <div class="status success">✓ Connection successful</div>
      {/if}
      {#if openaiStatus === 'error'}
        <div class="status error">✗ {openaiError}</div>
      {/if}
    </div>
  </section>

  <!-- LDAP Settings -->
  <section class="settings-section">
    <h2>LDAP Settings</h2>

    <div class="form-group">
      <label for="ldap-url">Server URL</label>
      <input
        id="ldap-url"
        type="text"
        bind:value={ldapUrl}
        placeholder="ldaps://dc1.example.com:636"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="ldap-base-dn">Base DN</label>
      <input
        id="ldap-base-dn"
        type="text"
        bind:value={ldapBaseDn}
        placeholder="ou=Users,dc=example,dc=com"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="ldap-admin-login">Admin Login</label>
      <input
        id="ldap-admin-login"
        type="text"
        bind:value={ldapAdminLogin}
        placeholder="admin@example.com"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="ldap-admin-password">Admin Password</label>
      <input
        id="ldap-admin-password"
        type="password"
        bind:value={ldapAdminPassword}
        placeholder="••••••••"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="ldap-cert">Certificate (.crt)</label>
      <input
        id="ldap-cert"
        type="file"
        accept=".crt,.pem"
        onchange={handleCertUpload}
        disabled={loading}
      />
      {#if ldapCertFile}
        <div class="file-info">{ldapCertFile.name}</div>
      {/if}
    </div>

    <button
      type="button"
      class="test-btn"
      onclick={testLDAP}
      disabled={!ldapUrl || !ldapBaseDn || !ldapAdminLogin || !ldapAdminPassword || ldapStatus === 'testing'}
    >
      {ldapStatus === 'testing' ? 'Testing...' : 'Test LDAP Connection'}
    </button>

    {#if ldapStatus === 'success'}
      <div class="status success">✓ LDAP connection successful</div>
    {/if}
    {#if ldapStatus === 'error'}
      <div class="status error">✗ {ldapError}</div>
    {/if}
  </section>

  <!-- Library Database Settings -->
  <section class="settings-section">
    <h2>Library Database (MSSQL)</h2>

    <div class="form-group">
      <label for="library-db-host">Host</label>
      <input
        id="library-db-host"
        type="text"
        bind:value={libraryDbHost}
        placeholder="10.0.1.16"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="library-db-port">Port</label>
      <input
        id="library-db-port"
        type="text"
        bind:value={libraryDbPort}
        placeholder="1433"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="library-db-name">Database Name</label>
      <input
        id="library-db-name"
        type="text"
        bind:value={libraryDbName}
        placeholder="marc"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="library-db-user">Username</label>
      <input
        id="library-db-user"
        type="text"
        bind:value={libraryDbUser}
        placeholder="marc"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="library-db-password">Password</label>
      <input
        id="library-db-password"
        type="password"
        bind:value={libraryDbPassword}
        placeholder="••••••••"
        disabled={loading}
      />
    </div>

    {#if libraryDbUrl}
      <div class="connection-string">
        <label>Connection String:</label>
        <code>{libraryDbUrl}</code>
      </div>
    {/if}

    <button
      type="button"
      class="test-btn"
      onclick={testLibraryDb}
      disabled={!libraryDbHost || !libraryDbName || !libraryDbUser || !libraryDbPassword || libraryDbStatus === 'testing'}
    >
      {libraryDbStatus === 'testing' ? 'Testing...' : 'Test Database Connection'}
    </button>

    {#if libraryDbStatus === 'success'}
      <div class="status success">✓ Database connection successful</div>
    {/if}
    {#if libraryDbStatus === 'error'}
      <div class="status error">✗ {libraryDbError}</div>
    {/if}
  </section>

  <!-- Save Button -->
  <div class="actions">
    <button
      type="button"
      class="save-btn"
      onclick={saveSettings}
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save Settings'}
    </button>
  </div>
</div>

<style>
  .settings-page {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    margin: 0 0 2rem 0;
    font-size: 1.75rem;
    color: var(--text-primary);
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .settings-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--input-bg);
    color: var(--text-primary);
    transition: border-color 0.2s;
  }

  input[type="text"]:focus,
  input[type="password"]:focus {
    outline: none;
    border-color: #4a7dc2;
  }

  input[type="file"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .input-with-button {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-button input {
    flex: 1;
  }

  .test-btn {
    padding: 0.75rem 1rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .test-btn:hover:not(:disabled) {
    background: var(--bg-quaternary);
  }

  .test-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status {
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .status.success {
    background: #d1e7dd;
    color: #0a3622;
    border: 1px solid #a3cfbb;
  }

  .status.error {
    background: #f8d7da;
    color: #842029;
    border: 1px solid #f1b0b7;
  }

  .file-info {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .connection-string {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
  }

  .connection-string label {
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .connection-string code {
    display: block;
    font-size: 0.875rem;
    color: var(--text-primary);
    word-break: break-all;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .save-btn {
    padding: 0.75rem 2rem;
    background: #4a7dc2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    background: #3d6ba8;
  }

  .save-btn:disabled {
    background: var(--bg-tertiary);
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
