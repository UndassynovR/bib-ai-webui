// src/lib/i18n/translations/en.ts
export default {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    confirm: 'Confirm',
  },

  chat: {
    newChat: 'New chat',
    loading: 'Loading conversation...',
    emptyTitle: 'Looking for a book?',
    emptyHint: 'Tell me what you need, and I will find it in the university library catalog.',
    error: 'An error occurred. Please try again.',
  },

  input: {
    placeholder: 'Enter a title, author, or topic...',
    send: 'Send message',
    sendHint: 'Send (Enter)',
  },

  nav: {
      chat: 'Intelligent Assistant of the University Library',
      login: 'Login',
  },
  
  sidebar: {
    toggle: 'Toggle sidebar',
    close: 'Close sidebar',
  
    newChat: 'New Chat',
    searchChats: 'Search Chats',
    bookmarks: 'Bookmarks',
  
    yourChats: 'Your chats',
  
	admin: "Admin dashboard",
    settings: 'Settings',
  
    account: 'Account',
	guest: 'Guest',
    accountSettings: 'Account settings',
    guestAccount: 'Guest account',
  },
  
  auth: {
    login: 'Login',
    signup: 'Sign Up',
  
    loginTitle: 'Welcome back',
    signupTitle: 'Create an account',
  
    loginHeading: 'Sign In',
    signupHeading: 'Create Account',
  
    loginSubtitle: 'Sign in to access your chats from any device',
    signupSubtitle: 'Register to save your chats permanently',
  
	username: 'Username',
    email: 'Email',
    password: 'Password',
  
    loginButton: 'Sign In',
    signupButton: 'Create Account',
  
    loggingIn: 'Logging in...',
    signingUp: 'Creating account...',
    pleaseWait: 'Please wait...',
  
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  
    continueAsGuest: 'Continue as guest',
    orContinueWith: 'Or continue with',
  
    invalidCredentials: 'Invalid email or password',
    emailAlreadyExists: 'Email already registered',
    guestUpgradeSuccess: 'Account upgraded! Your chats have been preserved.',

	universityAccount: 'University Account',
	personalAccount: 'Personal Account',
	universityHelper: 'Use your KazUTB credentials',
	personalHelper: 'Login with your registered email',
	usernamePlaceholder: 'username or username@kaztbu.edu.kz',
	unknownError: 'Something went wrong',
  },
  
  settings: {
    general: 'General',
    account: 'Account',
    
    generalTitle: 'General Settings',
    appearance: 'Appearance',
    appearanceDescription: 'Choose your preferred theme',
    language: 'Language',
    languageDescription: 'Select your preferred language',
    
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    
    languageAuto: 'Auto-detect',
    languageEnglish: 'English',
    languageRussian: 'Russian',
    languageKazakh: 'Kazakh',
    
    themeSaved: 'Theme saved successfully',
    languageSaved: 'Language saved successfully',
    saveFailed: 'Failed to save settings',
    
    accountTitle: 'Account Settings',
    accountEmail: 'Email',
    accountPassword: 'Password',
    accountName: 'Name',
    accountType: 'Account Type',
    changePassword: 'Change Password',
    updatePassword: 'Update Password',
    changing: 'Changing...',
    deleteAccount: 'Delete Account',
    deleteWarningTitle: 'This action cannot be undone',
    deleteWarningText: 'All your data including chat history will be permanently deleted.',
    deleteAccountWarning: 'All your data including chat history will be permanently deleted. This action is irreversible.',
    typeDeleteToConfirm: 'Type DELETE to confirm',
    typeDeleteInstruction: 'Type',
    toConfirm: 'to confirm',
    permanentlyDelete: 'Permanently Delete Account',
    deleting: 'Deleting...',
    upgradeAccount: 'Upgrade to a full account to save your chats',
    
    accountInformation: 'Account Information',
    guestAccount: 'Guest',
    universityAccount: 'University Account',
    personalAccount: 'Personal Account',
    security: 'Security',
    securityDescription: 'Manage your password and account security',
    
    accountActions: 'Account Actions',
    accountActionsDescription: 'Manage your session and account access',
    
    logout: 'Log Out',
    loggingOut: 'Logging out...',
    notSet: 'Not set',
    
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordChanged: 'Password changed successfully!',
    networkError: 'Network error. Please try again.',
    
    dangerZone: 'Danger Zone',
    dangerZoneDescription: 'Permanently delete your account and all associated data',
    confirmDeletion: 'Confirm Account Deletion',
  },

  bookmarks: {
    title: 'My Bookmarks',
    emptySubtitle: "You have no saved books yet",
    savedCount: 'Saved books: {count}',
    remove: 'Remove bookmark',
    authorNotSpecified: 'Author not specified',
    author: 'Author',
    yearTitle: 'Year: {year}',
    yearMissing: 'Year not specified',
    publisherTitle: 'Publisher: {publisher}',
    publisherMissing: 'Publisher not specified',
    emptyTitle: 'No saved books',
    emptyDescription: 'Start adding books to bookmarks to see them here',
    startBrowsing: 'Start Browsing',
    untitled: 'Untitled',
    close: 'Close',
    description: 'Description',
    loadingDescription: 'Loading description...',
    descriptionUnavailable: 'Description unavailable',
    descriptionError: 'Error loading description',
    bookInfo: 'Book Information',
    yearOfPublication: 'Year of Publication',
    publisher: 'Publisher',
    publicationPlace: 'Publication Place',
    keywords: 'Keywords',
  },

  chatSearch: {
    title: 'Search Chats',
    subtitle: 'Find messages in your conversations',
    close: 'Close',
    placeholder: 'Search by titles and messages...',
    clear: 'Clear',
    search: 'Search',
    searching: 'Searching chats...',
    noResults: 'Nothing found',
    tryDifferent: 'Try changing your search query',
    foundMatches: 'Found matches: {count}',
    matches: '{count} matches',
    similarTitles: 'Conversations with similar titles',
    enterQuery: 'Enter a search query',
    searchAllChats: 'We will search messages in all your conversations',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
  },

  bookCards: {
    authorNotSpecified: 'Author not specified',
    untitled: 'Untitled',
    showLess: 'Show less',
    showAll: 'Show all ({count})',
  },

  dashboard: {
    title: 'Dashboard',
    
    systemHealth: {
      title: 'System Health',
      description: 'Server status',
      uptime: 'Uptime',
      apiPing: 'API Ping',
      error: 'Error',
    },
    
    users: {
      title: 'Users',
      description: 'Overview of user accounts',
      total: 'Total',
      registered: 'Registered',
      guests: 'Guests',
      active: 'Active (7d)',
      newUsers: 'New Users',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
    },
    
    conversations: {
      title: 'Conversations',
      description: 'Chat activity statistics',
      total: 'Total',
      today: 'Today',
      thisWeek: 'This Week',
    },
    
    bookmarks: {
      title: 'Bookmarks',
      total: 'Total',
    },

	settings: {
	  title: 'Server settings',
	},
  },
};
