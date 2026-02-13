<script lang="ts">
  import { page } from '$app/stores';
  import { LogOut, Mail, Lock, Trash2, User, AlertTriangle } from '@lucide/svelte';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  
  let user = $derived($page.data.user);
  let isLoggingOut = $state(false);
  let isChangingPassword = $state(false);
  let isDeletingAccount = $state(false);
  let showPasswordChange = $state(false);
  let showDeleteConfirm = $state(false);
  
  // Password change state
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordError = $state('');
  let passwordSuccess = $state('');
  
  // Delete confirmation state
  let deleteConfirmText = $state('');
  let deleteError = $state('');
  
  // Check if user is a local account (not LDAP)
  let isLocalAccount = $derived(user?.auth_type === 'local' && !user?.is_guest);
  
  async function handleLogout() {
    if (isLoggingOut) return;
    
    isLoggingOut = true;
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      isLoggingOut = false;
    }
  }
  
  async function handlePasswordChange(e: Event) {
    e.preventDefault();
    passwordError = '';
    passwordSuccess = '';
    
    // Validation
    if (newPassword.length < 6) {
      passwordError = i18n.t('settings.passwordTooShort') || 'Password must be at least 6 characters';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError = i18n.t('settings.passwordsDoNotMatch') || 'Passwords do not match';
      return;
    }
    
    isChangingPassword = true;
    
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        passwordError = data.error || 'Failed to change password';
        isChangingPassword = false;
        return;
      }
      
      passwordSuccess = i18n.t('settings.passwordChanged') || 'Password changed successfully!';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      
      setTimeout(() => {
        showPasswordChange = false;
        passwordSuccess = '';
      }, 2000);
    } catch (error) {
      passwordError = i18n.t('settings.networkError') || 'Network error. Please try again.';
    } finally {
      isChangingPassword = false;
    }
  }
  
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      deleteError = i18n.t('settings.typeDeleteToConfirm') || 'Please type DELETE to confirm';
      return;
    }
    
    isDeletingAccount = true;
    deleteError = '';
    
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        deleteError = data.error || 'Failed to delete account';
        isDeletingAccount = false;
        return;
      }
      
      // Account deleted successfully, redirect to home
      window.location.href = '/';
    } catch (error) {
      deleteError = i18n.t('settings.networkError') || 'Network error. Please try again.';
      isDeletingAccount = false;
    }
  }
  
  function resetPasswordForm() {
    showPasswordChange = false;
    passwordError = '';
    passwordSuccess = '';
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
  }
  
  function resetDeleteForm() {
    showDeleteConfirm = false;
    deleteConfirmText = '';
    deleteError = '';
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h1>{i18n.t('settings.accountTitle')}</h1>
  </div>

  <div class="settings-section">
    <h2>{i18n.t('settings.accountInformation')}</h2>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">
          <Mail size={18} />
          <span>{i18n.t('settings.accountEmail')}</span>
        </div>
        <div class="info-value">
          {user?.email || i18n.t('settings.notSet')}
        </div>
      </div>
      
      {#if user?.name}
        <div class="info-item">
          <div class="info-label">
            <User size={18} />
            <span>{i18n.t('settings.accountName') || 'Name'}</span>
          </div>
          <div class="info-value">
            {user.name}
          </div>
        </div>
      {/if}
      
      <div class="info-item">
        <div class="info-label">
          <Lock size={18} />
          <span>{i18n.t('settings.accountType') || 'Account Type'}</span>
        </div>
        <div class="info-value">
          {#if user?.is_guest}
            {i18n.t('settings.guestAccount') || 'Guest'}
          {:else if user?.auth_type === 'ldap'}
            {i18n.t('settings.universityAccount') || 'University Account'}
          {:else}
            {i18n.t('settings.personalAccount') || 'Personal Account'}
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if isLocalAccount}
    <div class="settings-section">
      <h2>{i18n.t('settings.security') || 'Security'}</h2>
      <p class="section-description">
        {i18n.t('settings.securityDescription') || 'Manage your password and account security'}
      </p>

      {#if !showPasswordChange}
        <button
          class="action-btn secondary"
          onclick={() => showPasswordChange = true}
        >
          <Lock size={18} />
          <span>{i18n.t('settings.changePassword') || 'Change Password'}</span>
        </button>
      {:else}
        <div class="form-container">
          <div class="form-header">
            <h3>{i18n.t('settings.changePassword') || 'Change Password'}</h3>
            <button class="text-btn" onclick={resetPasswordForm}>
              {i18n.t('common.cancel') || 'Cancel'}
            </button>
          </div>
          
          <form onsubmit={handlePasswordChange}>
            {#if passwordError}
              <div class="message error">{passwordError}</div>
            {/if}
            
            {#if passwordSuccess}
              <div class="message success">{passwordSuccess}</div>
            {/if}
            
            <div class="form-group">
              <label for="current-password">
                {i18n.t('settings.currentPassword') || 'Current Password'}
              </label>
              <input
                id="current-password"
                type="password"
                bind:value={currentPassword}
                placeholder="••••••••"
                required
                disabled={isChangingPassword}
              />
            </div>
            
            <div class="form-group">
              <label for="new-password">
                {i18n.t('settings.newPassword') || 'New Password'}
              </label>
              <input
                id="new-password"
                type="password"
                bind:value={newPassword}
                placeholder="••••••••"
                required
                minlength="6"
                disabled={isChangingPassword}
              />
            </div>
            
            <div class="form-group">
              <label for="confirm-password">
                {i18n.t('settings.confirmPassword') || 'Confirm New Password'}
              </label>
              <input
                id="confirm-password"
                type="password"
                bind:value={confirmPassword}
                placeholder="••••••••"
                required
                minlength="6"
                disabled={isChangingPassword}
              />
            </div>
            
            <button
              type="submit"
              class="action-btn primary full-width"
              disabled={isChangingPassword}
            >
              {isChangingPassword 
                ? (i18n.t('settings.changing') || 'Changing...') 
                : (i18n.t('settings.updatePassword') || 'Update Password')}
            </button>
          </form>
        </div>
      {/if}
    </div>

    <div class="settings-section danger-zone">
      <h2>{i18n.t('settings.dangerZone') || 'Danger Zone'}</h2>
      <p class="section-description">
        {i18n.t('settings.dangerZoneDescription') || 'Permanently delete your account and all associated data'}
      </p>

      {#if !showDeleteConfirm}
        <button
          class="action-btn danger"
          onclick={() => showDeleteConfirm = true}
        >
          <Trash2 size={18} />
          <span>{i18n.t('settings.deleteAccount') || 'Delete Account'}</span>
        </button>
      {:else}
        <div class="form-container">
          <div class="form-header">
            <div class="header-with-icon">
              <AlertTriangle size={20} class="warning-icon" />
              <h3>{i18n.t('settings.confirmDeletion') || 'Confirm Account Deletion'}</h3>
            </div>
            <button class="text-btn" onclick={resetDeleteForm}>
              {i18n.t('common.cancel') || 'Cancel'}
            </button>
          </div>
          
          <div class="warning-text">
            <p><strong>{i18n.t('settings.deleteWarningTitle') || 'This action cannot be undone.'}</strong></p>
            <p>
              {i18n.t('settings.deleteWarningText') || 'All your data including chat history will be permanently deleted.'}
            </p>
            <p class="confirm-instruction">
              {i18n.t('settings.typeDeleteInstruction') || 'Type'} <strong>DELETE</strong> {i18n.t('settings.toConfirm') || 'to confirm'}
            </p>
          </div>
          
          {#if deleteError}
            <div class="message error">{deleteError}</div>
          {/if}
          
          <input
            type="text"
            bind:value={deleteConfirmText}
            placeholder="DELETE"
            class="confirm-input"
            disabled={isDeletingAccount}
          />
          
          <button
            class="action-btn danger full-width"
            onclick={handleDeleteAccount}
            disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
          >
            <Trash2 size={18} />
            <span>
              {isDeletingAccount 
                ? (i18n.t('settings.deleting') || 'Deleting...') 
                : (i18n.t('settings.permanentlyDelete') || 'Permanently Delete Account')}
            </span>
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="settings-section">
    <h2>{i18n.t('settings.accountActions')}</h2>
    <p class="section-description">
      {i18n.t('settings.accountActionsDescription')}
    </p>

    <button
      class="action-btn logout"
      onclick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut size={18} />
      <span>
        {isLoggingOut
          ? i18n.t('settings.loggingOut')
          : i18n.t('settings.logout')}
      </span>
    </button>
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
  }

  .settings-header h1 {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .settings-section {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-section.danger-zone {
    border-color: #dc2626;
  }

  .settings-section h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }

  .section-description {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--bg-tertiary);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .info-value {
    font-weight: 500;
    color: var(--text-primary);
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: fit-content;
  }

  .action-btn.logout,
  .action-btn.secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .action-btn.logout:hover:not(:disabled),
  .action-btn.secondary:hover:not(:disabled) {
    background: var(--bg-secondary);
    border-color: var(--border-color-hover);
  }

  .action-btn.primary {
    background: #4a7dc2;
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: #3d6ba8;
  }

  .action-btn.danger {
    background: #dc2626;
    color: white;
  }

  .action-btn.danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.full-width {
    width: 100%;
    justify-content: center;
  }

  .form-container {
    margin-top: 1rem;
    padding: 1.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }

  .header-with-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .text-btn:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--input-bg);
    color: var(--text-primary);
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #4a7dc2;
    box-shadow: 0 0 0 3px rgba(74, 125, 194, 0.1);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .message {
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .warning-text {
    margin-bottom: 1rem;
  }

  .warning-text p {
    margin: 0 0 0.75rem 0;
    color: var(--text-primary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .warning-text p:last-child {
    margin-bottom: 0;
  }

  .confirm-instruction {
    margin-top: 1rem;
  }

  .confirm-instruction strong {
    color: #dc2626;
  }

  .confirm-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #dc2626;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    box-sizing: border-box;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .confirm-input:focus {
    outline: none;
    border-color: #b91c1c;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .confirm-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .settings-page {
      padding: 1rem;
    }
    
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .action-btn {
      width: 100%;
      justify-content: center;
    }
    
    .form-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
