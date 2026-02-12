// src/lib/i18n/translations/kk.ts
export default {
  nav: {
    chat: 'Университет кітапханасының ақылды көмекшісі',
    login: 'Кіру',
  },
  
  chat: {
    newChat: 'Жаңа сөйлесу',
    loading: 'Сөйлесу жүктелуде...',
    emptyTitle: 'Кітап іздеп жүрсіз бе?',
    emptyHint: 'Не керек екенін жазыңыз, мен оны университет кітапханасының каталогынан табамын.',
    error: 'Қате пайда болды. Қайталап көріңіз.',
  },
  
  input: {
    placeholder: 'Атауын, авторын немесе тақырыбын енгізіңіз...',
    send: 'Жіберу',
    sendHint: 'Жіберу (Enter)',
  },
  
  sidebar: {
    toggle: 'Бүйір панелді ауыстыру',
    close: 'Бүйір панелді жабу',
    
    newChat: 'Жаңа сөйлесу',
    searchChats: 'Сөйлесулерді іздеу',
    bookmarks: 'Бетбелгілер',
    
    yourChats: 'Сөйлесулеріңіз',
    
	admin: "Бақылау тақтасы",
    settings: 'Баптаулар',
    
    account: 'Есептік жазба',
	guest: 'Қонақ',
    accountSettings: 'Есептік жазба баптаулары',
    guestAccount: 'Қонақ есептік жазбасы',
  },
  
  auth: {
    login: 'Кіру',
    signup: 'Тіркелу',
    
    loginTitle: 'Қош келдіңіз',
    signupTitle: 'Есептік жазба жасау',
    
    loginHeading: 'Кіру',
    signupHeading: 'Есептік жазба жасау',
    
    loginSubtitle: 'Сөйлесулерге кез келген құрылғыдан кіру үшін жүйеге кіріңіз',
    signupSubtitle: 'Сөйлесулерді сақтау үшін тіркеліңіз',
    
	username: 'Пайдаланушы аты',
    email: 'Email',
    password: 'Құпия сөз',
    
    loginButton: 'Кіру',
    signupButton: 'Есептік жазба жасау',
    
    loggingIn: 'Кіру...',
    signingUp: 'Есептік жазба жасау...',
    pleaseWait: 'Күте тұрыңыз...',
    
    alreadyHaveAccount: 'Есептік жазба бар ма?',
    dontHaveAccount: 'Есептік жазба жоқ па?',
    
    continueAsGuest: 'Қонақ ретінде жалғастыру',
    orContinueWith: 'Немесе осымен жалғастыру',
    
    invalidCredentials: 'Email немесе құпия сөз қате',
    emailAlreadyExists: 'Email бұрыннан тіркелген',
    guestUpgradeSuccess: 'Есептік жазба жаңартылды! Сөйлесулеріңіз сақталды.',
  },
  
  settings: {
    general: 'Жалпы',
    account: 'Есептік жазба',
    
    generalTitle: 'Жалпы баптаулар',
    appearance: 'Сыртқы түрі',
    appearanceDescription: 'Қалаған тақырыпты таңдаңыз',
    language: 'Тіл',
    languageDescription: 'Қалаған тілді таңдаңыз',
    
    themeSystem: 'Жүйелік',
    themeLight: 'Жарық',
    themeDark: 'Қараңғы',
    
    languageAuto: 'Автоанықтау',
    languageEnglish: 'English',
    languageRussian: 'Русский',
    languageKazakh: 'Қазақша',
    
    themeSaved: 'Тақырып сақталды',
    languageSaved: 'Тіл сақталды',
    saveFailed: 'Баптауларды сақтау сәтсіз аяқталды',
    
    accountTitle: 'Есептік жазба баптаулары',
    accountEmail: 'Email',
    accountPassword: 'Құпия сөз',
    accountName: 'Аты',
    changePassword: 'Құпия сөзді өзгерту',
    deleteAccount: 'Есептік жазбаны жою',
    deleteAccountWarning: 'Бұл әрекетті болдырмауға болмайды',
    upgradeAccount: 'Сөйлесулерді сақтау үшін толық есептік жазбаға жаңартыңыз',
    
    accountInformation: 'Есептік жазба туралы ақпарат',
    
    accountActions: 'Есептік жазба әрекеттері',
    accountActionsDescription: 'Сеанс пен есептік жазбаға қол жетімділікті басқару',
    
    logout: 'Шығу',
    loggingOut: 'Шығу...',
    notSet: 'Көрсетілмеген',
    
    currentPassword: 'Ағымдағы құпия сөз',
    newPassword: 'Жаңа құпия сөз',
    confirmPassword: 'Құпия сөзді растау',
  },
  
  bookmarks: {
    title: 'Менің бетбелгілерім',
    emptySubtitle: 'Әзірше сақталған кітаптарыңыз жоқ',
    savedCount: 'Сақталған кітаптар: {count}',
    remove: 'Бетбелгілерден жою',
    authorNotSpecified: 'Автор көрсетілмеген',
    author: 'Автор',
    yearTitle: 'Жыл: {year}',
    yearMissing: 'Жыл көрсетілмеген',
    publisherTitle: 'Баспа: {publisher}',
    publisherMissing: 'Баспа көрсетілмеген',
    emptyTitle: 'Сақталған кітаптар жоқ',
    emptyDescription: 'Мұнда көрсету үшін кітаптарды бетбелгілерге қосуды бастаңыз',
    startBrowsing: 'Қарауды бастау',
    untitled: 'Атаусыз',
    close: 'Жабу',
    description: 'Сипаттама',
    loadingDescription: 'Сипаттама жүктелуде...',
    descriptionUnavailable: 'Сипаттама қолжетімсіз',
    descriptionError: 'Сипаттаманы жүктеу қатесі',
    bookInfo: 'Кітап туралы ақпарат',
    yearOfPublication: 'Шығарылған жылы',
    publisher: 'Баспа',
    publicationPlace: 'Шығарылған жері',
    keywords: 'Кілт сөздер',
  },
  
  chatSearch: {
    title: 'Сөйлесулерде іздеу',
    subtitle: 'Сөйлесулеріңізден хабарларды табыңыз',
    close: 'Жабу',
    placeholder: 'Атауы мен хабарлары бойынша іздеу...',
    clear: 'Тазалау',
    search: 'Іздеу',
    searching: 'Сөйлесулерде іздеу...',
    noResults: 'Ештеңе табылмады',
    tryDifferent: 'Іздеу сұранысын өзгертіп көріңіз',
    foundMatches: 'Сәйкестіктер табылды: {count}',
    matches: '{count} сәйкестік',
    similarTitles: 'Ұқсас атаулы сөйлесулер',
    enterQuery: 'Іздеу үшін сұраныс енгізіңіз',
    searchAllChats: 'Барлық сөйлесулеріңізден хабарларды іздейміз',
    today: 'Бүгін',
    yesterday: 'Кеше',
    daysAgo: '{days} күн бұрын',
  },

  bookCards: {
    authorNotSpecified: 'Автор көрсетілмеген',
    untitled: 'Атаусыз',
    showLess: 'Азырақ көрсету',
    showAll: 'Барлығын көрсету ({count})',
  },

  dashboard: {
    title: 'Басқару тақтасы',
    
    systemHealth: {
      title: 'Жүйе жағдайы',
      description: 'Сервер күйі',
      uptime: 'Жұмыс уақыты',
      apiPing: 'API пингі',
      error: 'Қате',
    },
    
    users: {
      title: 'Пайдаланушылар',
      description: 'Тіркелгілерге шолу',
      total: 'Барлығы',
      registered: 'Тіркелген',
      guests: 'Қонақтар',
      active: 'Белсенді (7к)',
      newUsers: 'Жаңа пайдаланушылар',
      today: 'Бүгін',
      thisWeek: 'Осы аптада',
      thisMonth: 'Осы айда',
    },
    
    conversations: {
      title: 'Әңгімелер',
      description: 'Чат статистикасы',
      total: 'Барлығы',
      today: 'Бүгін',
      thisWeek: 'Осы аптада',
    },
    
    bookmarks: {
      title: 'Бетбелгілер',
      total: 'Барлығы',
    },

	settings: {
	  title: 'Сервер параметрлері',
	},
  },
};
