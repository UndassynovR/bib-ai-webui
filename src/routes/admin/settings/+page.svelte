<script lang="ts">
  import { i18n } from '$lib/stores/i18nStore.svelte';
  
  // Config State (UPPERCASE to match config.json keys)
  let OPENAI_API_KEY = $state('');
  let LDAP_URL = $state('');
  let LDAP_BASE_DN = $state('');
  let LDAP_ADMIN_LOGIN = $state('');
  let LDAP_ADMIN_PASSWORD = $state('');
  let LIBRARY_DB_HOST = $state('');
  let LIBRARY_DB_PORT = $state('1433');
  let LIBRARY_DB_NAME = $state('');
  let LIBRARY_DB_USER = $state('');
  let LIBRARY_DB_PASSWORD = $state('');
  
  // UI State
  let ldapCertFile = $state<File | null>(null);
  let loading = $state(false);
  
  let openaiStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let openaiError = $state('');
    
  let ldapStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let ldapError = $state('');
  
  let libraryDbStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
  let libraryDbError = $state('');
  
  let libraryDbUrl = $derived(LIBRARY_DB_HOST && LIBRARY_DB_NAME && LIBRARY_DB_USER && LIBRARY_DB_PASSWORD
    ? `mssql://${LIBRARY_DB_USER}:${LIBRARY_DB_PASSWORD}@${LIBRARY_DB_HOST}${LIBRARY_DB_PORT ? ':' + LIBRARY_DB_PORT : ''}/${LIBRARY_DB_NAME}?encrypt=true&trustServerCertificate=true`
    : '');
  
  async function loadSettings() {
    console.log('[Settings] Loading settings...');
    try {
      const response = await fetch('/api/admin/settings');
      console.log('[Settings] Load response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Settings] Loaded data:', Object.keys(data));
        
        // Bind data from JSON (UPPERCASE) to state
        OPENAI_API_KEY = data.OPENAI_API_KEY || '';
        LDAP_URL = data.LDAP_URL || '';
        LDAP_BASE_DN = data.LDAP_BASE_DN || '';
        LDAP_ADMIN_LOGIN = data.LDAP_ADMIN_LOGIN || '';
        LDAP_ADMIN_PASSWORD = data.LDAP_ADMIN_PASSWORD || '';
        LIBRARY_DB_HOST = data.LIBRARY_DB_HOST || '';
        LIBRARY_DB_PORT = data.LIBRARY_DB_PORT || '1433';
        LIBRARY_DB_NAME = data.LIBRARY_DB_NAME || '';
        LIBRARY_DB_USER = data.LIBRARY_DB_USER || '';
        LIBRARY_DB_PASSWORD = data.LIBRARY_DB_PASSWORD || '';
        
        console.log('[Settings] Successfully loaded settings');
      } else {
        console.error('[Settings] Load failed with status:', response.status);
        const text = await response.text();
        console.error('[Settings] Error response:', text);
      }
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
      console.error('[Settings] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
  
  async function testOpenAI() {
    console.log('[OpenAI] Testing connection...');
    openaiStatus = 'testing';
    openaiError = '';
    
    try {
      const requestBody = { apiKey: OPENAI_API_KEY };
      console.log('[OpenAI] Sending test request');
      
      const response = await fetch('/api/admin/settings/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[OpenAI] Response status:', response.status);
      const data = await response.json();
      console.log('[OpenAI] Response data:', data);
      
      if (response.ok) {
        openaiStatus = 'success';
        console.log('[OpenAI] Test successful');
      } else {
        openaiStatus = 'error';
        openaiError = data.error || 'Connection failed';
        console.error('[OpenAI] Test failed:', openaiError);
      }
    } catch (error) {
      openaiStatus = 'error';
      openaiError = 'Network error';
      console.error('[OpenAI] Network error:', error);
      console.error('[OpenAI] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
  
  async function testLDAP() {
    console.log('[LDAP] Testing connection...');
    ldapStatus = 'testing';
    ldapError = '';
    
    try {
      const formData = new FormData();
      formData.append('url', LDAP_URL);
      formData.append('baseDn', LDAP_BASE_DN);
      formData.append('adminLogin', LDAP_ADMIN_LOGIN);
      formData.append('adminPassword', LDAP_ADMIN_PASSWORD);
      
      if (ldapCertFile) {
        console.log('[LDAP] Including certificate file:', ldapCertFile.name);
        formData.append('certificate', ldapCertFile);
      }
      
      console.log('[LDAP] Form data entries:', Array.from(formData.keys()));
      console.log('[LDAP] Sending test request to /api/admin/settings/test-ldap');
      
      const response = await fetch('/api/admin/settings/test-ldap', {
        method: 'POST',
        body: formData
      });
      
      console.log('[LDAP] Response status:', response.status);
      console.log('[LDAP] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      console.log('[LDAP] Content-Type:', contentType);
      
      let data;
      try {
        const text = await response.text();
        console.log('[LDAP] Raw response text:', text.substring(0, 200));
        data = JSON.parse(text);
        console.log('[LDAP] Parsed response data:', data);
      } catch (parseError) {
        console.error('[LDAP] Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (response.ok) {
        ldapStatus = 'success';
        console.log('[LDAP] Test successful');
      } else {
        ldapStatus = 'error';
        ldapError = data.error || 'Connection failed';
        console.error('[LDAP] Test failed:', ldapError);
      }
    } catch (error) {
      ldapStatus = 'error';
      ldapError = error instanceof Error ? error.message : 'Network error';
      console.error('[LDAP] Network error:', error);
      console.error('[LDAP] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
  
  async function testLibraryDb() {
    console.log('[LibraryDB] Testing connection...');
    libraryDbStatus = 'testing';
    libraryDbError = '';
    
    try {
      const requestBody = {
        host: LIBRARY_DB_HOST,
        port: LIBRARY_DB_PORT,
        database: LIBRARY_DB_NAME,
        user: LIBRARY_DB_USER,
        password: LIBRARY_DB_PASSWORD
      };
      
      console.log('[LibraryDB] Request body (sanitized):', {
        host: LIBRARY_DB_HOST,
        port: LIBRARY_DB_PORT,
        database: LIBRARY_DB_NAME,
        user: LIBRARY_DB_USER,
        password: '***'
      });
      
      const response = await fetch('/api/admin/settings/test-library-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[LibraryDB] Response status:', response.status);
      const data = await response.json();
      console.log('[LibraryDB] Response data:', data);
      
      if (response.ok) {
        libraryDbStatus = 'success';
        console.log('[LibraryDB] Test successful');
      } else {
        libraryDbStatus = 'error';
        libraryDbError = data.error || 'Connection failed';
        console.error('[LibraryDB] Test failed:', libraryDbError);
      }
    } catch (error) {
      libraryDbStatus = 'error';
      libraryDbError = 'Network error';
      console.error('[LibraryDB] Network error:', error);
      console.error('[LibraryDB] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
  
  async function saveSettings() {
    console.log('[Save] Starting save operation...');
    loading = true;
    
    try {
      const formData = new FormData();
      formData.append('OPENAI_API_KEY', OPENAI_API_KEY);
      formData.append('LDAP_URL', LDAP_URL);
      formData.append('LDAP_BASE_DN', LDAP_BASE_DN);
      formData.append('LDAP_ADMIN_LOGIN', LDAP_ADMIN_LOGIN);
      formData.append('LDAP_ADMIN_PASSWORD', LDAP_ADMIN_PASSWORD);
      formData.append('LIBRARY_DB_HOST', LIBRARY_DB_HOST);
      formData.append('LIBRARY_DB_PORT', LIBRARY_DB_PORT);
      formData.append('LIBRARY_DB_NAME', LIBRARY_DB_NAME);
      formData.append('LIBRARY_DB_USER', LIBRARY_DB_USER);
      formData.append('LIBRARY_DB_PASSWORD', LIBRARY_DB_PASSWORD);
            
      if (ldapCertFile) {
        console.log('[Save] Including LDAP certificate:', ldapCertFile.name);
        formData.append('LDAP_CERTIFICATE', ldapCertFile);
      }
      
      console.log('[Save] Form data keys:', Array.from(formData.keys()));
      console.log('[Save] Sending POST to /api/admin/settings');
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        body: formData
      });
      
      console.log('[Save] Response status:', response.status);
      console.log('[Save] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('[Save] Save successful');
        alert('Settings saved successfully');
        await loadSettings(); // Re-load to ensure state is fresh
      } else {
        const contentType = response.headers.get('content-type');
        console.log('[Save] Error response content-type:', contentType);
        
        let errorMessage = 'Unknown error';
        try {
          const text = await response.text();
          console.log('[Save] Error response text:', text);
          const data = JSON.parse(text);
          errorMessage = data.error || 'Unknown error';
        } catch (parseError) {
          console.error('[Save] Failed to parse error response:', parseError);
          errorMessage = 'Invalid response from server';
        }
        
        console.error('[Save] Save failed:', errorMessage);
        alert('Failed to save settings: ' + errorMessage);
      }
    } catch (error) {
      console.error('[Save] Network error:', error);
      console.error('[Save] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Network error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      loading = false;
      console.log('[Save] Save operation completed');
    }
  }
  
  function handleCertUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      ldapCertFile = input.files[0];
      console.log('[CertUpload] File selected:', ldapCertFile.name, 'Size:', ldapCertFile.size);
    }
  }
  
  $effect(() => {
    console.log('[Effect] Component mounted, loading settings');
    loadSettings();
  });
</script>

<div class="settings-page">
  <h1>{i18n.t('dashboard.settings.title')}</h1>
  
  <section class="settings-section">
    <h2>OpenAI API</h2>
    <div class="form-group">
      <label for="openai-key">API Key</label>
      <div class="input-with-button">
        <input
          id="openai-key"
          type="password"
          bind:value={OPENAI_API_KEY}
          placeholder="sk-proj-..."
          disabled={loading}
        />
        <button
          type="button"
          class="test-btn"
          onclick={testOpenAI}
          disabled={!OPENAI_API_KEY || openaiStatus === 'testing'}
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
  
  <section class="settings-section">
    <h2>LDAP Settings</h2>
    <div class="form-group">
      <label for="ldap-url">Server URL</label>
      <input id="ldap-url" type="text" bind:value={LDAP_URL} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="ldap-base-dn">Base DN</label>
      <input id="ldap-base-dn" type="text" bind:value={LDAP_BASE_DN} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="ldap-admin-login">Admin Login</label>
      <input id="ldap-admin-login" type="text" bind:value={LDAP_ADMIN_LOGIN} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="ldap-admin-password">Admin Password</label>
      <input id="ldap-admin-password" type="password" bind:value={LDAP_ADMIN_PASSWORD} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="ldap-cert">Certificate (.crt)</label>
      <input id="ldap-cert" type="file" accept=".crt,.pem" onchange={handleCertUpload} disabled={loading} />
      {#if ldapCertFile}
        <div class="file-info">{ldapCertFile.name}</div>
      {/if}
    </div>
    <button
      type="button"
      class="test-btn"
      onclick={testLDAP}
      disabled={!LDAP_URL || !LDAP_BASE_DN || !LDAP_ADMIN_LOGIN || !LDAP_ADMIN_PASSWORD || ldapStatus === 'testing'}
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
  
  <section class="settings-section">
    <h2>Library Database (MSSQL)</h2>
    <div class="form-group">
      <label for="library-db-host">Host</label>
      <input id="library-db-host" type="text" bind:value={LIBRARY_DB_HOST} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="library-db-port">Port</label>
      <input id="library-db-port" type="text" bind:value={LIBRARY_DB_PORT} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="library-db-name">Database Name</label>
      <input id="library-db-name" type="text" bind:value={LIBRARY_DB_NAME} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="library-db-user">Username</label>
      <input id="library-db-user" type="text" bind:value={LIBRARY_DB_USER} disabled={loading} />
    </div>
    <div class="form-group">
      <label for="library-db-password">Password</label>
      <input id="library-db-password" type="password" bind:value={LIBRARY_DB_PASSWORD} disabled={loading} />
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
      disabled={!LIBRARY_DB_HOST || !LIBRARY_DB_NAME || !LIBRARY_DB_USER || !LIBRARY_DB_PASSWORD || libraryDbStatus === 'testing'}
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
  
  <div class="actions">
    <button type="button" class="save-btn" onclick={saveSettings} disabled={loading}>
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
