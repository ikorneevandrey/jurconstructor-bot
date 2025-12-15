const SyncDataService = require('../services/SyncDataService');
const fs = require('fs');
const path = require('path');

class ConsentExporter {
  static exportToCSV() {
    const allUsers = SyncDataService.getAllUsers();
    const consents = [];
    
    Object.values(allUsers).forEach(user => {
      consents.push({
        userId: user.id,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        consentAccepted: user.privacyConsentAccepted || false,
        consentDate: user.privacyConsentDate || '',
        consentRefused: user.consentRefused || false,
        createdAt: user.createdAt || '',
        lastActivity: user.lastActivity || ''
      });
    });
    
    // Сортируем по дате согласия
    consents.sort((a, b) => {
      const dateA = a.consentDate ? new Date(a.consentDate) : new Date(0);
      const dateB = b.consentDate ? new Date(b.consentDate) : new Date(0);
      return dateB - dateA;
    });
    
    // Создаем CSV
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
    
    const csvRows = [
      headers.join(';'),
      ...consents.map(c => [
        c.userId,
        `@${c.username}`,
        c.firstName,
        c.lastName,
        c.consentAccepted ? 'ДА' : 'НЕТ',
        c.consentDate ? new Date(c.consentDate).toISOString() : '',
        c.consentRefused ? 'ДА' : 'НЕТ',
        c.createdAt ? new Date(c.createdAt).toISOString() : '',
        c.lastActivity ? new Date(c.lastActivity).toISOString() : ''
      ].join(';'))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Сохраняем файл
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const filename = `consents_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    
    console.log(`✅ Экспортировано ${consents.length} записей согласий`);
    console.log(`📁 Файл: ${filepath}`);
    
    return filepath;
  }
  
  static exportToJSON() {
    const allUsers = SyncDataService.getAllUsers();
    const consents = {};
    
    Object.values(allUsers).forEach(user => {
      consents[user.id] = {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        privacyConsentAccepted: user.privacyConsentAccepted || false,
        privacyConsentDate: user.privacyConsentDate || null,
        consentRefused: user.consentRefused || false,
        createdAt: user.createdAt,
        lastActivity: user.lastActivity
      };
    });
    
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const filename = `consents_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(consents, null, 2), 'utf8');
    
    console.log(`✅ Экспортировано ${Object.keys(consents).length} записей согласий в JSON`);
    console.log(`📁 Файл: ${filepath}`);
    
    return filepath;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  console.log('🔄 Экспорт согласий на обработку ПД...');
  ConsentExporter.exportToCSV();
  ConsentExporter.exportToJSON();
  console.log('✅ Экспорт завершен');
}

module.exports = ConsentExporter;