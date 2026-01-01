import ConsentService from '../services/ConsentService.js';

export default async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const user = await ConsentService.getUser(userId);

  if (!user || !user.privacyConsentAccepted) {
    await ctx.reply(
      '⚠️ Для работы с ботом необходимо принять согласие на обработку персональных данных. Используйте /start'
    );
    return;
  }

  return next();
};
