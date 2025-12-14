const fs = require('fs');
const path = require('path');

class SyncHelpers {
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
}

module.exports = SyncHelpers;