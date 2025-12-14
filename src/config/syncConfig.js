const fs = require('fs');
const path = require('path');

class SyncConfig {
  constructor(configPath = 'config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      // Проверяем наличие config.json
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
      
      // Если нет, создаем дефолтную конфигурацию
      const defaultConfig = this.getDefaultConfig();
      this.saveConfig(defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
      return this.getDefaultConfig();
    }
  }

  saveConfig(config = null) {
    try {
      const data = config || this.config;
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения конфигурации:', error);
      return false;
    }
  }

  getDefaultConfig() {
    return {
      bot: {
        name: "JurConstructor Bot",
        version: "1.0.0",
        adminIds: [], // ID администраторов
        supportChat: "@support",
        language: "ru"
      },
      features: {
        documentGeneration: true,
        caseManagement: true,
        userRegistration: true,
        notifications: true,
        backupEnabled: true,
        backupInterval: 24 // часов
      },
      limits: {
        maxCasesPerUser: 10,
        maxDocumentsPerCase: 5,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        dailyRequests: 50
      },
      ui: {
        mainMenuButtons: 4,
        showHelpButton: true,
        showStatsButton: true,
        paginationItems: 5
      },
      paths: {
        data: "data/",
        backups: "backups/",
        exports: "exports/",
        logs: "logs/",
        templates: "templates/"
      }
    };
  }

  // Геттеры для удобства
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  // Сеттеры
  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  // Добавление администратора
  addAdmin(adminId) {
    const admins = this.get('bot.adminIds', []);
    if (!admins.includes(adminId)) {
      admins.push(adminId);
      this.set('bot.adminIds', admins);
      return true;
    }
    return false;
  }

  // Проверка является ли пользователь админом
  isAdmin(userId) {
    const admins = this.get('bot.adminIds', []);
    return admins.includes(userId);
  }

  // Получение всех настроек
  getAll() {
    return this.config;
  }

  // Сброс к дефолтным настройкам
  reset() {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    return this.config;
  }
}

module.exports = new SyncConfig();