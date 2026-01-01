import { Telegraf, Markup, Scenes, session } from 'telegraf';
import ConsentService from '../../services/ConsentService.js';
import consentCheck from '../../middleware/consentCheck.js';
import { setupAgreementHandlers } from '../handlers/agreement.js';
import logger from '../../utils/logger.js';
import registrationScene from './scenes/registration.js'; // создайте сцену регистрации

export function createBot(token) {
  const bot = new Telegraf(token);

  // Поддержка сцен
  const stage = new Scenes.Stage([registrationScene], { ttl: 300 });
  bot.use(session());
  bot.use(stage.middleware());

  // Middleware согласия
  bot.use(consentCheck);

  // Команды
  bot.start(async ctx => {
    const userId = ctx.from.id;
    const user = await ConsentService.getUser(userId);

    if (!user) {
      await ConsentService.saveUser(userId, {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name
      });
    }

    // Показываем согласие
    await ctx.reply(
      '🔐 Пожалуйста, примите условия обработки персональных данных.',
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Принимаю', 'agreement_accept')],
        [Markup.button.callback('❌ Отказываюсь', 'agreement_decline')]
      ])
    );
  });

  bot.command('privacy_stats', async ctx => {
    const userId = ctx.from.id;
    const admins = process.env.ADMIN_IDS?.split(',') || [];
    if (!admins.includes(String(userId))) return ctx.reply('⛔ Нет прав');

    const users = await ConsentService.getAllUsers();
    const accepted = users.filter(u => u.privacyConsentAccepted).length;
    const refused = users.filter(u => u.consentRefused).length;

    await ctx.reply(`Всего: ${users.length}\nСогласие принято: ${accepted}\nОтказ: ${refused}`);
  });

  // Подключаем обработчики согласия
  setupAgreementHandlers(bot);

  return bot;
}
