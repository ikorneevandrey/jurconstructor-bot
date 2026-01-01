import 'dotenv/config';
import { createBot } from './bot/core/bot.js';
import db from './database/db.js';
import logger from './utils/logger.js';
import express from 'express';

async function bootstrap() {
  try {
    // Инициализация БД
    await db.init();
    logger.info('База данных инициализирована');
    
    // Создание бота
    const bot = createBot(process.env.BOT_TOKEN);
    
    // Создаем Express сервер для health check
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'telegram-bot'
      });
    });
    
    app.get('/', (req, res) => {
      res.send('Telegram Bot is running');
    });
    
    // Запускаем сервер
    app.listen(PORT, () => {
      logger.info(`Health check сервер запущен на порту ${PORT}`);
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Получен сигнал ${signal}, останавливаем бота...`);
      await bot.stop(signal);
      process.exit(0);
    };
    
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    
    // Запуск бота
    await bot.launch();
    
    logger.info('🤖 Бот успешно запущен!');
    
  } catch (error) {
    logger.error('Критическая ошибка при запуске:', error);
    process.exit(1);
  }
}

bootstrap();