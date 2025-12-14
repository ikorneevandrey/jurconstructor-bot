const SyncDataService = require('../services/SyncDataService');

const stats = SyncDataService.getStats();
console.log('📊 Статистика бота:');
console.log(`👥 Пользователей: ${stats.totalUsers}`);
console.log(`📦 Заказов: ${stats.totalOrders}`);
console.log(`📁 Дел: ${stats.totalCases}`);
console.log(`🔄 Обновлено: ${new Date(stats.lastUpdated).toLocaleString()}`);