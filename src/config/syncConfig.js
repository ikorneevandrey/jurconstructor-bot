// src/config/syncConfig.js
const path = require('path');

class SyncConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Загрузка конфигурации из файла или переменных окружения
   */
  loadConfig() {
    const defaultConfig = this.getDefaultConfig();
    
    try {
      // Попытка загрузить конфиг из файла
      const configPath = path.join(__dirname, 'config.json');
      if (require('fs').existsSync(configPath)) {
        const userConfig = require(configPath);
        return this.mergeConfigs(defaultConfig, userConfig);
      }
    } catch (error) {
      console.warn('Не удалось загрузить конфигурацию из файла:', error.message);
    }
    
    return defaultConfig;
  }

  /**
   * Конфигурация по умолчанию
   */
  getDefaultConfig() {
    return {
      // === НАСТРОЙКИ БОТА ===
      bot: {
        name: "JurConstructor Bot",
        version: "1.0.0",
        adminIds: process.env.ADMIN_IDS ? 
          process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [],
        supportChat: process.env.SUPPORT_CHAT || "@support",
        language: "ru",
        privacyPdfUrl: process.env.PRIVACY_PDF_URL || "https://your-domain.com/privacy.pdf",
        termsPdfUrl: process.env.TERMS_PDF_URL || "https://your-domain.com/terms.pdf"
      },
      
      // === НАСТРОЙКИ ФУНКЦИОНАЛА ===
      features: {
        // Основные функции
        documentGeneration: true,
        caseManagement: true,
        userRegistration: true,
        notifications: true,
        
        // Бэкапы
        backupEnabled: true,
        backupInterval: 24, // часов
        maxBackups: 10,
        
        // Согласие на обработку ПД
        privacyConsentRequired: true,
        consentValidityDays: 365, // Срок действия согласия в днях
        requireReConsentAfterDays: 365, // Требовать повторное согласие через дней
        showConsentReminderDays: [30, 7, 1], // За сколько дней напоминать
        
        // Безопасность
        enableTwoFactorAuth: false,
        maxLoginAttempts: 5,
        sessionTimeout: 30, // минут
      },
      
      // === НАСТРОЙКИ БАЗЫ ДАННЫХ ===
      database: {
        path: path.join(__dirname, '../../data/database.json'),
        backupPath: path.join(__dirname, '../../backups'),
        exportPath: path.join(__dirname, '../../exports'),
        logPath: path.join(__dirname, '../../logs'),
        
        // Настройки хранения согласий
        consentRetentionPeriod: 1095, // Хранить согласия 3 года (в днях)
        autoDeleteExpiredConsents: false,
        
        // Лимиты
        maxUsers: 10000,
        maxCasesPerUser: 100,
        maxDocumentsPerCase: 50
      },
      
      // === НАСТРОЙКИ БЕЗОПАСНОСТИ ===
      security: {
        // Согласие на обработку ПД
        requirePrivacyConsent: true,
        requireExplicitConsent: true, // Требовать явное согласие (не по умолчанию)
        allowConsentWithdrawal: true,
        consentWithdrawalGracePeriod: 30, // Дней на обработку отзыва
        
        // Хранение данных
        encryptSensitiveData: false,
        anonymizeInactiveUsers: false,
        anonymizeAfterDays: 180,
        
        // Экспорт данных
        allowDataExport: true,
        exportRequiresAdminApproval: false,
        maxExportSize: 10485760, // 10MB
      },
      
      // === НАСТРОЙКИ ЛОГИРОВАНИЯ ===
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        levels: {
          error: true,
          warn: true,
          info: true,
          debug: process.env.NODE_ENV === 'development'
        },
        
        // Логи согласий
        logConsentChanges: true,
        logConsentWithdrawals: true,
        logAdminActions: true,
        
        // Файлы логов
        fileEnabled: true,
        filePath: path.join(__dirname, '../../logs/bot.log'),
        maxFileSize: 10485760, // 10MB
        maxFiles: 10
      },
      
      // === НАСТРОЙКИ ИМПОРТА/ЭКСПОРТА ===
      import: {
        allowedFormats: ['json', 'csv'],
        maxFileSize: 5242880, // 5MB
        defaultDateFormat: 'YYYY-MM-DD',
        requiredFields: ['userId', 'privacyConsentAccepted'],
        
        // Валидация данных согласий при импорте
        validateConsentData: true,
        requireConsentDate: true,
        allowPartialImports: false
      },
      
      export: {
        allowedFormats: ['json', 'csv', 'pdf'],
        includeTimestamps: true,
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        
        // Экспорт согласий
        includeConsentHistory: true,
        includeUserData: true,
        anonymizeExportedData: false,
        
        // Автоматический экспорт
        autoExportEnabled: false,
        autoExportInterval: 30, // дней
        autoExportFormat: 'csv'
      },
      
      // === НАСТРОЙКИ УВЕДОМЛЕНИЙ ===
      notifications: {
        // Уведомления о согласиях
        notifyOnNewConsent: true,
        notifyOnConsentWithdrawal: true,
        notifyAdminsOnConsentIssues: true,
        
        // Напоминания
        sendConsentReminders: true,
        reminderChannels: ['telegram', 'email'], // Поддерживаемые каналы
        reminderSchedule: '10:00', // Время отправки напоминаний
      },
      
      // === ЮРИДИЧЕСКИЕ НАСТРОЙКИ ===
      legal: {
        // Соответствие законодательству
        gdprCompliant: false, // Соответствие GDPR
        pdplCompliant: true,  // Соответствие 152-ФЗ (Россия)
        
        // Хранение данных
        dataRetentionPeriod: 1095, // 3 года в днях
        rightToBeForgotten: true,
        
        // Контактная информация оператора
        operatorName: "ООО 'Юрист-Конструктор'",
        operatorAddress: "г. Москва, ул. Примерная, д. 1",
        operatorEmail: "privacy@jurconstructor.ru",
        operatorPhone: "+7 (999) 123-45-67",
        
        // DPO (Data Protection Officer)
        dpoName: "Иванов Иван Иванович",
        dpoEmail: "dpo@jurconstructor.ru",
        dpoPhone: "+7 (999) 987-65-43"
      },
      
      // === НАСТРОЙКИ ДЛЯ РАЗРАБОТЧИКОВ ===
      development: {
        debugMode: process.env.NODE_ENV === 'development',
        skipConsentValidation: false,
        allowTestUsers: true,
        testUserIds: [123456789, 987654321],
        
        // Логирование разработки
        logDatabaseOperations: false,
        logMiddlewareCalls: false,
        logStateTransitions: false
      }
    };
  }

  /**
   * Слияние конфигураций
   */
  mergeConfigs(defaultConfig, userConfig) {
    const result = JSON.parse(JSON.stringify(defaultConfig));
    
    const mergeDeep = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          mergeDeep(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };
    
    mergeDeep(result, userConfig);
    return result;
  }

  /**
   * Получить значение конфигурации
   */
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

  /**
   * Установить значение конфигурации
   */
  set(key, value) {
    const keys = key.split('.');
    let config = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!config[k] || typeof config[k] !== 'object') {
        config[k] = {};
      }
      config = config[k];
    }
    
    config[keys[keys.length - 1]] = value;
  }

  /**
   * Получить всю конфигурацию
   */
  getAll() {
    return this.config;
  }

  /**
   * Проверка, является ли пользователь администратором
   */
  isAdmin(userId) {
    const adminIds = this.get('bot.adminIds', []);
    return adminIds.includes(Number(userId));
  }

  /**
   * Получение URL соглашения о конфиденциальности
   */
  getPrivacyPdfUrl() {
    return this.get('bot.privacyPdfUrl');
  }

  /**
   * Проверка, требуется ли согласие на обработку данных
   */
  isPrivacyConsentRequired() {
    return this.get('features.privacyConsentRequired', true);
  }

  /**
   * Получение срока действия согласия в днях
   */
  getConsentValidityDays() {
    return this.get('features.consentValidityDays', 365);
  }

  /**
   * Проверка, включен ли режим отладки
   */
  isDebugMode() {
    return this.get('development.debugMode', false);
  }

  /**
   * Получение контактной информации оператора
   */
  getOperatorInfo() {
    return {
      name: this.get('legal.operatorName'),
      address: this.get('legal.operatorAddress'),
      email: this.get('legal.operatorEmail'),
      phone: this.get('legal.operatorPhone')
    };
  }

  /**
   * Сохранение конфигурации в файл
   */
  save() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      const fs = require('fs');
      
      // Создаем директорию, если её нет
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('✅ Конфигурация сохранена в', configPath);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения конфигурации:', error);
      return false;
    }
  }

  /**
   * Сброс конфигурации к значениям по умолчанию
   */
  reset() {
    this.config = this.getDefaultConfig();
    console.log('🔄 Конфигурация сброшена к значениям по умолчанию');
  }

  /**
   * Вывод текущей конфигурации в консоль
   */
  print() {
    console.log('📋 Текущая конфигурация:');
    console.log(JSON.stringify(this.config, null, 2));
  }
}

module.exports = new SyncConfig();