class SyncConfig {
  constructor() {
    this.config = this.getDefaultConfig();
  }

  // Возвращает объект с настройками по умолчанию
  getDefaultConfig() {
    return {
      bot: {
        name: "JurConstructor Bot",
        version: "1.0.0",
        adminIds: [], // Здесь указываешь ID администраторов
        supportChat: "@support",
        privacyPdfUrl: "https://disk.yandex.ru/i/iN8LYPvxzELuOg"
      },
      features: {
        privacyConsentRequired: true,
        documentGeneration: true,
        caseManagement: true,
        userRegistration: true,
        notifications: true,
        backupEnabled: true,
        backupInterval: 24 // интервал автобэкапа в часах
      }
    };
  }

  // Универсальный метод для получения значения по пути вида "bot.adminIds"
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = this.config;

    for (const key of keys) {
      if (result && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }

    return result;
  }

  // Проверка, является ли пользователь администратором
  isAdmin(userId) {
    return this.get('bot.adminIds', []).includes(userId);
  }
}

module.exports = new SyncConfig();
