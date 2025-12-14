// Загружаем переменные окружения
require('dotenv').config();

// Синхронный бот
const SyncBot = require('./bot');
const SyncHelpers = require('./utils/syncHelpers');

function main() {
  try {
    console.log('🚀 Запуск JurConstructor Bot...');
    console.log('📅', SyncHelpers.formatDate());
    
    // Проверяем токен
    if (!process.env.BOT_TOKEN) {
      throw new Error('❌ BOT_TOKEN не найден в .env файле');
    }
    
    // Инициализируем и запускаем бота
    const bot = new SyncBot();
    bot.initialize();
    bot.start();
    
    console.log('🤖 Бот готов к работе!');
    console.log('📞 Для остановки нажмите Ctrl+C');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    SyncHelpers.handleError(error, 'Критическая ошибка при запуске');
    process.exit(1);
  }
}

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('⚠️ Необработанное исключение:', error);
  SyncHelpers.handleError(error, 'Необработанное исключение');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Необработанный промис:', reason);
  SyncHelpers.handleError(reason, 'Необработанный промис');
});

// Запускаем бота
main();