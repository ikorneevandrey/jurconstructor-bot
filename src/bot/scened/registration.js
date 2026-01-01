import { Scenes } from 'telegraf';
import { UserService } from '../../services/UserService.js';
import { validatePhone, validateUsername } from '../../utils/validators.js';

export const registrationScene = new Scenes.WizardScene(
  'registration',
  
  // Шаг 1: Запрос имени пользователя
  async (ctx) => {
    await ctx.reply('📝 Пожалуйста, введите ваш логин (3-20 символов, только буквы, цифры и подчеркивания):');
    return ctx.wizard.next();
  },
  
  // Шаг 2: Обработка логина
  async (ctx) => {
    const username = ctx.message?.text?.trim();
    
    if (!username || !validateUsername(username)) {
      await ctx.reply('❌ Некорректный логин. Пожалуйста, введите логин (3-20 символов):');
      return;
    }
    
    ctx.wizard.state.username = username;
    await ctx.reply('📱 Теперь введите ваш номер телефона в формате +79991234567:');
    return ctx.wizard.next();
  },
  
  // Шаг 3: Обработка телефона
  async (ctx) => {
    const phone = ctx.message?.text?.trim();
    
    if (!phone || !validatePhone(phone)) {
      await ctx.reply('❌ Некорректный номер телефона. Используйте формат +79991234567:');
      return;
    }
    
    const { username } = ctx.wizard.state;
    
    try {
      await UserService.updateUser(ctx.from.id, {
        username,
        phoneNumber: phone
      });
      
      await ctx.reply('✅ Регистрация завершена! Теперь вы можете пользоваться всеми функциями бота.');
      return ctx.scene.leave();
    } catch (error) {
      await ctx.reply('❌ Произошла ошибка при сохранении данных. Попробуйте позже.');
      return ctx.scene.leave();
    }
  }
);

// Middleware для проверки необходимости регистрации
export async function checkRegistration(ctx, next) {
  if (ctx.user?.agreementAccepted && (!ctx.user.username || !ctx.user.phoneNumber)) {
    await ctx.scene.enter('registration');
    return;
  }
  
  return next();
}