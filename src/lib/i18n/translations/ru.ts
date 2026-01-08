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
  
    settings: 'Настройки',
  
    account: 'Аккаунт',
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
    guestAccount: 'Гостевой аккаунт',
    registeredAccount: 'Зарегистрированный аккаунт',
    upgradeAccount: 'Обновите до полного аккаунта, чтобы сохранять чаты',
  
    accountInformation: 'Информация об аккаунте',
    accountType: 'Тип аккаунта',
  
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
  
    emptySubtitle: 'Вы ещё не добавили ни одной книги в закладки',
    savedCount: 'Сохранено: {count}',
  
    remove: 'Удалить закладку',
  
    notSpecified: 'Не указано',
  
    yearTitle: 'Год: {year}',
    yearMissing: 'Год не указан',
  
    publisherTitle: 'Издательство: {publisher}',
    publisherMissing: 'Издательство не указано',
  
    volumeTitle: 'Том: {volume}',
    volumeMissing: 'Том не указан',
  
    availableTitle: 'Доступно: {count}',
    quantityMissing: 'Количество не указано',
  
    emptyTitle: 'Закладок пока нет',
    emptyDescription:
      'Просматривайте библиотеку и добавляйте книги в закладки, чтобы быстро находить их позже.',
    startBrowsing: 'Начать просмотр',
  },
};
