// src/lib/i18n/translations/en.ts
export default {
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
  
    settings: 'Settings',
  
    account: 'Account',
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
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    deleteAccountWarning: 'This action cannot be undone',
    guestAccount: 'Guest Account',
    registeredAccount: 'Registered Account',
    upgradeAccount: 'Upgrade to a full account to save your chats',
  
    accountInformation: 'Account Information',
    accountType: 'Account Type',
  
    accountActions: 'Account Actions',
    accountActionsDescription: 'Manage your session and account access',
  
    logout: 'Log Out',
    loggingOut: 'Logging out...',
    notSet: 'Not set',
  
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
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
};
