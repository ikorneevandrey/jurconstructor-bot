import ConsentService from '../../services/ConsentService.js';
import { agreementKeyboard, declineConfirmKeyboard } from '../keyboards/index.js';
import logger from '../../utils/logger.js';

export function setupAgreementHandlers(bot) {
  // Принятие согласия
  bot.action('agreement_accept', async (ctx) => {
    try {
      await ConsentService.saveConsent(ctx.from.id, true);

      await ctx.editMessageText(
        '✅ <b>Согласие принято!</b>\n\n' +
        'Теперь вы можете использовать все функции бота.\n\n' +
        '📝 Для завершения регистрации введите ваш логин и номер телефона.',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
      );

      logger.info(`Пользователь ${ctx.from.id} принял согласие`);

      // Автоматически запускаем сцену регистрации через секунду
      setTimeout(() => {
        ctx.scene.enter('registration').catch(() => {});
      }, 1000);

    } catch (error) {
      logger.error(`Ошибка принятия согласия: ${error.message}`);
      await ctx.answerCbQuery('Произошла ошибка. Попробуйте позже.');
    }
  });

  // Отказ от согласия (первый шаг - подтверждение)
  bot.action('agreement_decline', async (ctx) => {
    await ctx.editMessageText(
      '⚠️ <b>Вы уверены, что хотите отказаться?</b>\n\n' +
      'Без принятия согласия вы не сможете использовать бота.\n\n' +
      'Вы можете вернуться к соглашению и принять условия.',
      { parse_mode: 'HTML', ...declineConfirmKeyboard }
    );
  });

  // Подтверждение отказа
  bot.action('agreement_confirm_decline', async (ctx) => {
    await ConsentService.saveConsent(ctx.from.id, false);

    await ctx.editMessageText(
      '❌ <b>Вы отказались от условий обработки персональных данных.</b>\n\n' +
      'Бот не может быть использован без вашего согласия.\n\n' +
      'Если передумаете, нажмите /start',
      { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
    );

    logger.info(`Пользователь ${ctx.from.id} отказался от согласия`);
  });

  // Возврат к соглашению
  bot.action('agreement_back', async (ctx) => {
    await ctx.editMessageText(
      ctx.callbackQuery.message.text,
      { parse_mode: 'HTML', ...agreementKeyboard }
    );
  });
}
