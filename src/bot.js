const { Telegraf, Markup } = require('telegraf');
const SyncDataService = require('./services/SyncDataService');
const SyncConfig = require('./config/syncConfig');
const SyncHelpers = require('./utils/syncHelpers');

class SyncBot {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.userStates = {};
  }

  initialize() {
    try {
      const token = process.env.BOT_TOKEN;
      if (!token) throw new Error('BOT_TOKEN не найден');

      this.bot = new Telegraf(token);
      SyncDataService.init();

      this.setupMiddlewares();
      this.registerCommands();
      this.registerHandlers();
      this.setupErrorHandling();

      return this;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  setupMiddlewares() {
    this.bot.use((ctx, next) => {
      if (ctx.from?.id) {
        SyncDataService.saveUser(ctx.from.id, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          lastActivity: new Date().toISOString(),
          isActive: true,
          notifications: true
        });
      }
      return next();
    });
  }

  registerCommands() {
    this.bot.command('start', (ctx) => {
      this.showMainMenu(ctx);
    });

    this.bot.command('menu', (ctx) => {
      this.showMainMenu(ctx);
    });
  }

  registerHandlers() {
    this.bot.on('text', (ctx) => {
      const userId = ctx.from.id;
      const text = ctx.message.text;
      const state = this.userStates[userId]?.step || 'main_menu';

      switch (state) {
        case 'awaiting_document_name':
          return this.handleDocumentName(ctx, userId, text);

        case 'awaiting_document_description':
          return this.handleDocumentDescription(ctx, userId, text);

        case 'awaiting_consultation':
          return this.handleConsultation(ctx, userId, text);

        default:
          return this.handleMainMenuSelection(ctx, userId, text);
      }
    });

    this.bot.on('callback_query', (ctx) => {
      ctx.answerCbQuery().catch(() => {});
      const data = ctx.callbackQuery.data;
      const userId = ctx.from.id;

      if (data.startsWith('template_')) {
        return this.handleTemplateSelection(ctx, userId, data.replace('template_', ''));
      }

      if (data.startsWith('case_')) {
        return this.handleCaseSelection(ctx, userId, data.replace('case_', ''));
      }

      if (data === 'toggle_notifications') {
        return this.toggleNotifications(ctx, userId);
      }
    });
  }

  showMainMenu(ctx) {
    ctx.reply(
      '🏠 Главное меню',
      Markup.keyboard([
        ['📄 Создать документ', '📁 Мои дела'],
        ['⚖️ Консультация', '⚙️ Настройки']
      ]).resize()
    );
    this.userStates[ctx.from.id] = { step: 'main_menu' };
  }

  handleMainMenuSelection(ctx, userId, text) {
    if (text === '⚖️ Консультация') {
      this.userStates[userId] = { step: 'awaiting_consultation' };
      return ctx.reply('Опишите ваш вопрос');
    }

    ctx.reply('Используйте меню');
  }

  handleConsultation(ctx, userId, text) {
    this.userStates[userId] = { step: 'main_menu' };
    ctx.reply('Ваш вопрос принят. Юрист свяжется с вами.');
    this.showMainMenu(ctx);
  }

  handleCaseSelection(ctx, userId, caseId) {
    ctx.reply(`📁 Вы выбрали дело ID: ${caseId}`);
  }

  toggleNotifications(ctx, userId) {
    const user = SyncDataService.getUser(userId);
    const value = !user.notifications;
    SyncDataService.updateUser(userId, { notifications: value });
    ctx.reply(`Уведомления ${value ? 'включены' : 'выключены'}`);
  }

  setupErrorHandling() {
    this.bot.catch((err) => {
      console.error(err);
    });
  }

  start() {
    this.bot.launch();
    console.log('Бот запущен');
  }
}

module.exports = SyncBot;
