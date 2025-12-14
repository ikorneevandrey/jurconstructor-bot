const SyncDataService = require('../services/SyncDataService');

console.log('🔄 Создание ручной резервной копии...');
const backupPath = SyncDataService.createBackup();

if (backupPath) {
  console.log(`✅ Бэкап создан: ${backupPath}`);
} else {
  console.log('❌ Ошибка создания бэкапа');
  process.exit(1);
}