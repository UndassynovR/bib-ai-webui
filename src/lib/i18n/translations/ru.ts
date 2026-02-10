// src/lib/i18n/translations/ru.ts
export default {
  chat: {
    newChat: 'Новый чат',
    loading: 'Загрузка диалога...',
	emptyTitle: 'Ищете книгу?',
	emptyHint: 'Напишите, что вам нужно, и я найду это в каталоге библиотеки университета.',
    error: 'Произошла ошибка. Пожалуйста, попробуйте ещё раз.',
  },

  input: {
	placeholder: 'Введите название, автора или тему...',
    send: 'Отправить сообщение',
    sendHint: 'Отправить (Enter)',
  },
  
  nav: {
    chat: 'Интеллектуальный ассистент библиотеки университета',
    login: 'Войти',
  },
  
  sidebar: {
    toggle: 'Переключить боковую панель',
    close: 'Закрыть боковую панель',
  
    newChat: 'Новый чат',
    searchChats: 'Поиск чатов',
    bookmarks: 'Закладки',
  
    yourChats: 'Ваши чаты',
  
	admin: "Панель управления",
    settings: 'Настройки',
  
    account: 'Аккаунт',
	guest: 'Гость',
    accountSettings: 'Настройки аккаунта',
    guestAccount: 'Гостевой аккаунт',
  },
  
 auth: {
    login: 'Вход',
    signup: 'Регистрация',
  
    loginTitle: 'С возвращением',
    signupTitle: 'Создать аккаунт',
  
    loginHeading: 'Войти',
    signupHeading: 'Создать аккаунт',
  
    loginSubtitle: 'Войдите, чтобы получить доступ к чатам с любого устройства',
    signupSubtitle: 'Зарегистрируйтесь, чтобы сохранить чаты навсегда',
  
   username: 'Имя пользователя',
    email: 'Email',
    password: 'Пароль',
  
    loginButton: 'Войти',
    signupButton: 'Создать аккаунт',
  
    loggingIn: 'Вход...',
    signingUp: 'Создание аккаунта...',
    pleaseWait: 'Пожалуйста, подождите...',
  
    alreadyHaveAccount: 'Уже есть аккаунт?',
    dontHaveAccount: 'Нет аккаунта?',
  
    continueAsGuest: 'Продолжить как гость',
    orContinueWith: 'Или продолжить с',
  
    invalidCredentials: 'Неверный email или пароль',
    emailAlreadyExists: 'Email уже зарегистрирован',
    guestUpgradeSuccess: 'Аккаунт обновлен! Ваши чаты сохранены.',
  },
 
  settings: {
    general: 'Общие',
    account: 'Аккаунт',
  
    generalTitle: 'Общие настройки',
    appearance: 'Внешний вид',
    appearanceDescription: 'Выберите предпочитаемую тему',
    language: 'Язык',
    languageDescription: 'Выберите предпочитаемый язык',
  
    themeSystem: 'Системная',
    themeLight: 'Светлая',
    themeDark: 'Темная',
  
    languageAuto: 'Автоопределение',
    languageEnglish: 'English',
    languageRussian: 'Русский',
    languageKazakh: 'Қазақша',
  
    themeSaved: 'Тема сохранена',
    languageSaved: 'Язык сохранен',
    saveFailed: 'Не удалось сохранить настройки',
  
    accountTitle: 'Настройки аккаунта',
    accountEmail: 'Email',
    accountPassword: 'Пароль',
    accountName: 'Имя',
    changePassword: 'Изменить пароль',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountWarning: 'Это действие нельзя отменить',
    upgradeAccount: 'Обновите до полного аккаунта, чтобы сохранять чаты',
  
    accountInformation: 'Информация об аккаунте',
  
    accountActions: 'Действия с аккаунтом',
    accountActionsDescription: 'Управление сессией и доступом к аккаунту',
  
    logout: 'Выйти',
    loggingOut: 'Выход...',
    notSet: 'Не указано',
  
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
  },

  bookmarks: {
    title: 'Мои закладки',
    emptySubtitle: 'У вас пока нет сохраненных книг',
    savedCount: 'Сохранено книг: {count}',
    remove: 'Удалить из закладок',
    authorNotSpecified: 'Автор не указан',
    author: 'Автор',
    yearTitle: 'Год: {year}',
    yearMissing: 'Год не указан',
    publisherTitle: 'Издательство: {publisher}',
    publisherMissing: 'Издательство не указано',
    emptyTitle: 'Нет сохраненных книг',
    emptyDescription: 'Начните добавлять книги в закладки, чтобы они появились здесь',
    startBrowsing: 'Начать просмотр',
    untitled: 'Без названия',
    close: 'Закрыть',
    description: 'Описание',
    loadingDescription: 'Загрузка описания...',
    descriptionUnavailable: 'Описание недоступно',
    descriptionError: 'Ошибка загрузки описания',
    bookInfo: 'Информация о книге',
    yearOfPublication: 'Год издания',
    publisher: 'Издательство',
    publicationPlace: 'Место издания',
    keywords: 'Ключевые слова',
  },

  chatSearch: {
    title: 'Поиск в чатах',
    subtitle: 'Найдите сообщения в ваших беседах',
    close: 'Закрыть',
    placeholder: 'Поиск по названиям и сообщениям...',
    clear: 'Очистить',
    search: 'Искать',
    searching: 'Поиск в чатах...',
    noResults: 'Ничего не найдено',
    tryDifferent: 'Попробуйте изменить поисковый запрос',
    foundMatches: 'Найдено совпадений: {count}',
    matches: '{count} совпадений',
    similarTitles: 'Беседы с похожим названием',
    enterQuery: 'Введите запрос для поиска',
    searchAllChats: 'Мы найдем сообщения во всех ваших беседах',
    today: 'Сегодня',
    yesterday: 'Вчера',
    daysAgo: '{days} дн. назад',
  },

  bookCards: {
    authorNotSpecified: 'Автор не указан',
    untitled: 'Без названия',
    showLess: 'Показать меньше',
    showAll: 'Показать все ({count})',
  },

  dashboard: {
    title: 'Панель управления',
    
    systemHealth: {
      title: 'Состояние системы',
      description: 'Статус сервера',
      uptime: 'Время работы',
      apiPing: 'Пинг API',
      error: 'Ошибка',
    },
    
    users: {
      title: 'Пользователи',
      description: 'Обзор учетных записей',
      total: 'Всего',
      registered: 'Зарегистрированные',
      guests: 'Гости',
      active: 'Активные (7д)',
      newUsers: 'Новые пользователи',
      today: 'Сегодня',
      thisWeek: 'На этой неделе',
      thisMonth: 'В этом месяце',
    },
    
    conversations: {
      title: 'Чаты',
      description: 'Статистика чатов',
      total: 'Всего',
      today: 'Сегодня',
      thisWeek: 'На этой неделе',
    },
    
    bookmarks: {
      title: 'Закладки',
      total: 'Всего',
    },
  },
};
