'use strict';

// Загружаем переменные окружения.
// Локально они берутся из файла .env,
// в Amvera — из переменных окружения приложения.
require('dotenv').config();

const SyncBot = require('./bot');
const SyncHelpers = require('./utils/syncHelpers');

/**
 * Точка входа приложения
 */
function main() {
  console.log('========================================');
  console.log('🚀 Запуск JurConstructor Bot');
  console.log('📅 Дата запуска:', SyncHelpers.formatDate());
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'не задан');
  console.log(
    '🔑 Переменная BOT_TOKEN присутствует:',
    Boolean(process.env.BOT_TOKEN)
  );
  console.log('========================================');

  // Проверяем наличие токена Telegram-бота
  if (!process.env.BOT_TOKEN) {
    console.error('❌ Ошибка: переменная окружения BOT_TOKEN не задана');
    process.exit(1);
  }

  try {
    // Создаём экземпляр бота
    const bot = new SyncBot();

    // Инициализация бота (регистрация команд, middleware и т.д.)
    bot.initialize();

    // Запуск бота
    bot.start();

    console.log('🤖 Бот успешно запущен и готов к работе');
    console.log('📞 Для остановки нажмите Ctrl+C');
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске бота:', error);
    SyncHelpers.handleError(error, 'Критическая ошибка при запуске бота');
    process.exit(1);
  }
}

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('⚠️ Необработанное исключение:', error);
  try {
    SyncHelpers.handleError(error, 'Необработанное исключение');
  } finally {
    process.exit(1);
  }
});

// Обработка необработанных промисов
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Необработанное отклонение промиса:', reason);
  try {
    SyncHelpers.handleError(reason, 'Необработанное отклонение промиса');
  } finally {
    process.exit(1);
  }
});

// Корректное завершение приложения
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM. Завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT. Завершение работы...');
  process.exit(0);
});

// Запуск приложения
main();
