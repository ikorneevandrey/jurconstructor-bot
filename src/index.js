import 'dotenv/config';
import { createBot, setupHealthCheck } from './bot/core/bot.js';
import db from './database/db.js';
import logger from './utils/logger.js';

async function bootstrap() {
  try {
    // Инициализация БД
    await db.init();
    logger.info('База данных инициализирована');
    
    // Создание бота
    const bot = createBot(process.env.BOT_TOKEN);
    
    // Настройка health check (если используем webhook)
    if (process.env.USE_WEBHOOK) {
      setupHealthCheck(bot);
    }
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Получен сигнал ${signal}, останавливаем бота...`);
      await bot.stop(signal);
      process.exit(0);
    };
    
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    
    // Запуск бота
    if (process.env.USE_WEBHOOK) {
      await bot.launch({
        webhook: {
          domain: process.env.WEBHOOK_DOMAIN,
          port: process.env.PORT || 3000
        }
      });
    } else {
      await bot.launch();
    }
    
    logger.info('🤖 Бот успешно запущен!');
    
  } catch (error) {
    logger.error('Критическая ошибка при запуске:', error);
    process.exit(1);
  }
}

bootstrap();