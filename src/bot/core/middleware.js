import db from '../../database/db.js';
import logger from '../../utils/logger.js';
import { UserService } from '../../services/UserService.js';

// Middleware для инициализации пользователя
export async function userMiddleware(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return next();

  try {
    let user = await db.users.get(userId);
    
    // Если пользователя нет - создаем
    if (!user) {
      user = await UserService.createUser({
        id: userId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        languageCode: ctx.from.language_code
      });
      
      logger.info(`Новый пользователь: ${userId} (@${ctx.from.username})`);
    }
    
    // Сохраняем в контексте сразу
    ctx.user = user;
    ctx.userId = userId;
    
    return next();
  } catch (error) {
    logger.error(`Ошибка в userMiddleware: ${error.message}`, error);
    return next();
  }
}

// Middleware для проверки согласия
export async function consentMiddleware(ctx, next) {
  const allowedWithoutConsent = [
    'start',
    'agreement_accept',
    'agreement_decline',
    'agreement_confirm_decline'
  ];
  
  const command = ctx.message?.text?.replace('/', '') || 
                  ctx.callbackQuery?.data?.split('_')[0];
  
  // Разрешаем команды без согласия
  if (allowedWithoutConsent.includes(command)) {
    return next();
  }
  
  // Проверяем согласие
  if (!ctx.user?.agreementAccepted) {
    await ctx.reply(
      '⚠️ Для использования бота необходимо принять условия обработки персональных данных.\n\n' +
      'Используйте команду /start'
    );
    return;
  }
  
  return next();
}

// Middleware для проверки админа
export async function adminMiddleware(ctx, next) {
  const admins = await db.admins.getAll();
  ctx.isAdmin = admins.includes(ctx.userId);
  return next();
}