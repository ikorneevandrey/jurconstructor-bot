const fs = require('fs');
const path = require('path');

class SyncHelpers {
  // ==================== СУЩЕСТВУЮЩИЕ МЕТОДЫ ====================
  
  // Задержка (синхронная - блокирующая)
  static sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Просто ждем
    }
  }

  // Чтение JSON файла
  static readJsonFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Ошибка чтения файла ${filePath}:`, error);
      return null;
    }
  }

  // Запись JSON файла
  static writeJsonFile(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Ошибка записи файла ${filePath}:`, error);
      return false;
    }
  }

  // Генерация уникального ID
  static generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Форматирование даты
  static formatDate(date = new Date()) {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Валидация email
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Валидация телефона
  static isValidPhone(phone) {
    const regex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return regex.test(phone);
  }

  // Разделение текста на части
  static splitText(text, maxLength = 4096) {
    const parts = [];
    let currentPart = '';
    
    const lines = text.split('\n');
    for (const line of lines) {
      if (currentPart.length + line.length + 1 > maxLength) {
        parts.push(currentPart);
        currentPart = line;
      } else {
        currentPart += (currentPart ? '\n' : '') + line;
      }
    }
    
    if (currentPart) {
      parts.push(currentPart);
    }
    
    return parts;
  }

  // Создание клавиатуры
  static createKeyboard(buttons, columns = 2) {
    const keyboard = [];
    let row = [];
    
    buttons.forEach((button, index) => {
      row.push(button);
      
      if ((index + 1) % columns === 0 || index === buttons.length - 1) {
        keyboard.push(row);
        row = [];
      }
    });
    
    return keyboard;
  }

  // Логирование
  static log(message, type = 'info') {
    const timestamp = this.formatDate();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    // Запись в файл
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `${type}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  // Обработка ошибок
  static handleError(error, context = '') {
    const errorMessage = context ? `${context}: ${error.message}` : error.message;
    this.log(errorMessage, 'error');
    
    // Можно отправить уведомление админу
    if (process.env.ADMIN_ID) {
      // Здесь можно добавить отправку сообщения админу
    }
  }

  // Экспорт данных
  static exportData(data, format = 'json') {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const exportPath = path.join(exportDir, `export_${Date.now()}.${format}`);
      
      if (format === 'json') {
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        // Простая конвертация в CSV
        const csv = this.convertToCSV(data);
        fs.writeFileSync(exportPath, csv);
      }
      
      return exportPath;
    } catch (error) {
      this.handleError(error, 'Ошибка экспорта данных');
      return null;
    }
  }

  static convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        `"${(row[header] || '').toString().replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');
    
    return csv;
  }

  // ==================== НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С СОГЛАСИЕМ ====================
  
  /**
   * Форматирование даты для согласия на обработку ПД
   * @param {Date|string} date - Дата согласия
   * @returns {string} Отформатированная дата
   */
  static formatConsentDate(date) {
    if (!date) return 'Нет данных';
    
    try {
      const d = new Date(date);
      
      // Проверка валидности даты
      if (isNaN(d.getTime())) {
        return 'Неверная дата';
      }
      
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты согласия:', error);
      return 'Ошибка формата';
    }
  }
  
  /**
   * Форматирование временной метки для логов
   * @param {Date|string} date - Дата
   * @returns {string} Отформатированная дата
   */
  static formatDateTime(date = new Date()) {
    const d = new Date(date);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Форматирование даты в ISO строку
   * @param {Date|string} date - Дата
   * @returns {string} ISO строка
   */
  static formatDateISO(date = new Date()) {
    return new Date(date).toISOString();
  }
  
  /**
   * Проверка истечения срока согласия
   * @param {Date|string} consentDate - Дата согласия
   * @param {number} validityDays - Срок действия в днях (по умолчанию 365)
   * @returns {boolean} Истек ли срок
   */
  static isConsentExpired(consentDate, validityDays = 365) {
    if (!consentDate) return true;
    
    const consentTime = new Date(consentDate).getTime();
    const currentTime = Date.now();
    const validityMs = validityDays * 24 * 60 * 60 * 1000;
    
    return (currentTime - consentTime) > validityMs;
  }
  
  /**
   * Расчет оставшихся дней согласия
   * @param {Date|string} consentDate - Дата согласия
   * @param {number} validityDays - Срок действия в днях
   * @returns {number} Оставшиеся дни
   */
  static getConsentDaysRemaining(consentDate, validityDays = 365) {
    if (!consentDate) return 0;
    
    const consentTime = new Date(consentDate).getTime();
    const currentTime = Date.now();
    const validityMs = validityDays * 24 * 60 * 60 * 1000;
    const elapsedMs = currentTime - consentTime;
    const remainingMs = validityMs - elapsedMs;
    
    return Math.max(0, Math.floor(remainingMs / (24 * 60 * 60 * 1000)));
  }
  
  /**
   * Генерация текста для напоминания о согласии
   * @param {Object} user - Объект пользователя
   * @returns {string} Текст напоминания
   */
  static generateConsentReminder(user) {
    if (!user || !user.privacyConsentDate) {
      return '⚠️ У вас не принято соглашение на обработку персональных данных.';
    }
    
    const consentDate = new Date(user.privacyConsentDate);
    const daysRemaining = this.getConsentDaysRemaining(user.privacyConsentDate);
    
    if (daysRemaining === 0) {
      return `⏰ Срок вашего согласия на обработку ПД истек ${this.formatConsentDate(consentDate)}. Пожалуйста, обновите согласие.`;
    } else if (daysRemaining <= 30) {
      return `⏰ Ваше согласие на обработку ПД истекает через ${daysRemaining} дней (принято ${this.formatConsentDate(consentDate)}). Пожалуйста, обновите согласие.`;
    }
    
    return null;
  }
  
  /**
   * Проверка валидности данных согласия
   * @param {Object} consentData - Данные согласия
   * @returns {Object} Результат проверки
   */
  static validateConsentData(consentData) {
    const errors = [];
    const warnings = [];
    
    // Проверка обязательных полей
    if (!consentData.userId) {
      errors.push('Отсутствует ID пользователя');
    }
    
    if (!consentData.privacyConsentDate) {
      errors.push('Отсутствует дата согласия');
    } else if (isNaN(new Date(consentData.privacyConsentDate).getTime())) {
      errors.push('Неверный формат даты согласия');
    }
    
    // Проверка типа данных
    if (typeof consentData.privacyConsentAccepted !== 'boolean') {
      warnings.push('Тип данных для согласия должен быть boolean');
    }
    
    // Проверка дат на корректность
    if (consentData.createdAt && isNaN(new Date(consentData.createdAt).getTime())) {
      warnings.push('Неверный формат даты создания');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Парсинг данных из различных форматов файлов
   * @param {string} filePath - Путь к файлу
   * @param {string} format - Формат файла (json, csv, txt)
   * @returns {Array} Массив данных
   */
  static parseFileData(filePath, format = 'auto') {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Файл не найден: ${filePath}`);
      }
      
      // Автоопределение формата по расширению
      if (format === 'auto') {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.json') format = 'json';
        else if (ext === '.csv') format = 'csv';
        else if (ext === '.txt') format = 'txt';
        else throw new Error(`Неизвестный формат файла: ${ext}`);
      }
      
      switch (format) {
        case 'json':
          return this.parseJsonData(filePath);
        case 'csv':
          return this.parseCsvData(filePath);
        case 'txt':
          return this.parseTxtData(filePath);
        default:
          throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      this.handleError(error, 'Ошибка парсинга файла');
      return null;
    }
  }
  
  /**
   * Парсинг JSON файла
   */
  static parseJsonData(filePath) {
    const data = this.readJsonFile(filePath);
    if (!data) return [];
    
    // Поддержка разных структур JSON
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object') {
      if (data.users && Array.isArray(data.users)) return data.users;
      if (data.consents && Array.isArray(data.consents)) return data.consents;
      if (data.data && Array.isArray(data.data)) return data.data;
      return [data];
    }
    
    return [];
  }
  
  /**
   * Парсинг CSV файла (упрощенный)
   */
  static parseCsvData(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index];
        }
      });
      
      result.push(row);
    }
    
    return result;
  }
  
  /**
   * Парсинг текстового файла
   */
  static parseTxtData(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    return lines.map(line => {
      // Определение формата строки
      if (line.includes('|')) {
        return this.parsePipeSeparated(line);
      } else if (line.includes(';')) {
        return this.parseSemicolonSeparated(line);
      } else {
        return this.parseCommaSeparated(line);
      }
    });
  }
  
  /**
   * Парсинг строки с разделителем "|"
   */
  static parsePipeSeparated(line) {
    const parts = line.split('|').map(p => p.trim());
    return {
      id: parts[0] || '',
      name: parts[1] || '',
      email: parts[2] || '',
      phone: parts[3] || '',
      privacyConsentDate: parts[4] || null,
      source: 'txt_pipe'
    };
  }
  
  /**
   * Парсинг строки с разделителем ";"
   */
  static parseSemicolonSeparated(line) {
    const parts = line.split(';').map(p => p.trim());
    return {
      userId: parts[0] || '',
      username: parts[1] || '',
      firstName: parts[2] || '',
      privacyConsentAccepted: parts[3] === 'true',
      createdAt: parts[4] || '',
      source: 'txt_semicolon'
    };
  }
  
  /**
   * Парсинг строки с разделителем ","
   */
  static parseCommaSeparated(line) {
    const parts = line.split(',').map(p => p.trim());
    return {
      name: parts[0] || '',
      surname: parts[1] || '',
      age: parseInt(parts[2]) || 0,
      city: parts[3] || '',
      email: parts[4] || '',
      source: 'txt_comma'
    };
  }
  
  /**
   * Экспорт согласий в различные форматы
   * @param {Array} consents - Массив согласий
   * @param {string} format - Формат экспорта (json, csv)
   * @returns {string} Путь к экспортированному файлу
   */
  static exportConsents(consents, format = 'json') {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportPath = path.join(exportDir, `consents_${timestamp}.${format}`);
      
      if (format === 'json') {
        const exportData = {
          metadata: {
            exportedAt: new Date().toISOString(),
            totalConsents: consents.length,
            format: 'json'
          },
          consents: consents
        };
        
        this.writeJsonFile(exportPath, exportData);
      } else if (format === 'csv') {
        const csvData = this.convertConsentsToCSV(consents);
        fs.writeFileSync(exportPath, csvData, 'utf8');
      }
      
      this.log(`Экспортировано ${consents.length} согласий в ${format}`, 'info');
      return exportPath;
      
    } catch (error) {
      this.handleError(error, 'Ошибка экспорта согласий');
      return null;
    }
  }
  
  /**
   * Конвертация согласий в CSV
   */
  static convertConsentsToCSV(consents) {
    if (!Array.isArray(consents) || consents.length === 0) {
      return '';
    }
    
    const headers = [
      'ID пользователя',
      'Имя пользователя',
      'Имя',
      'Фамилия',
      'Согласие принято',
      'Дата согласия',
      'Согласие отозвано',
      'Дата регистрации',
      'Последняя активность'
    ];
    
    const rows = consents.map(consent => [
      consent.userId || '',
      consent.username ? `@${consent.username}` : '',
      consent.firstName || '',
      consent.lastName || '',
      consent.privacyConsentAccepted ? 'ДА' : 'НЕТ',
      consent.privacyConsentDate ? this.formatDateISO(consent.privacyConsentDate) : '',
      consent.consentRefused ? 'ДА' : 'НЕТ',
      consent.createdAt ? this.formatDateISO(consent.createdAt) : '',
      consent.lastActivity ? this.formatDateISO(consent.lastActivity) : ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
  }
}

module.exports = SyncHelpers;