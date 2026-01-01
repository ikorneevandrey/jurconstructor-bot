import { Telegraf, Scenes, session } from 'telegraf';
import { 
  userMiddleware, 
  consentMiddleware, 
  adminMiddleware 
} from './middleware.js';
import { registrationScene } from '../scenes/registration.js';
import { setupAllHandlers } from '../handlers/index.js';
import logger from '../../utils/logger.js';

export function createBot(token) {
  const bot = new Telegraf(token);
  
  // Сценарий регистрации
  const stage = new Scenes.Stage([registrationScene]);
  
  // Middleware
  bot.use(session());
  bot.use(stage.middleware());
  bot.use(userMiddleware);
  bot.use(consentMiddleware);
  bot.use(adminMiddleware);
  
  // Настройка обработчиков
  setupAllHandlers(bot);
  
  // Глобальная обработка ошибок
  bot.catch((error, ctx) => {
    logger.error(`Глобальная ошибка: ${error.message}`, error, {
      userId: ctx.from?.id,
      updateType: ctx.updateType
    });
    
    if (ctx.chat) {
      ctx.reply('❌ Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.')
        .catch(e => logger.error('Не удалось отправить сообщение об ошибке', e));
    }
  });
  
  return bot;
}

// Health check эндпоинт (для Amvera)
export function setupHealthCheck(bot) {
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL || ''}/health`);
  
  bot.telegram.on('webhook', async (ctx) => {
    if (ctx.req.url === '/health') {
      try {
        const stats = await db.getStats();
        ctx.res.statusCode = 200;
        ctx.res.end(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          stats 
        }));
      } catch (error) {
        ctx.res.statusCode = 500;
        ctx.res.end(JSON.stringify({ error: 'Database error' }));
      }
    }
  });
}