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
      console.log('🚀 Инициализация синхронного бота...');
      
      const config = SyncConfig.getAll();
      console.log(`🤖 Бот: ${config.bot.name} v${config.bot.version}`);
      
      const token = process.env.BOT_TOKEN;
      if (!token) {
        throw new Error('BOT_TOKEN не найден в переменных окружения');
      }
      
      this.bot = new Telegraf(token);
      
      SyncDataService.init();
      
      this.setupMiddlewares();
      this.registerCommands();
      this.registerHandlers();
      this.setupErrorHandling();
      
      console.log('✅ Бот инициализирован успешно');
      return this;
      
    } catch (error) {
      console.error('❌ Ошибка инициализации бота:', error);
      throw error;
    }
  }

  setupMiddlewares() {
    // Middleware для проверки согласия на обработку ПД
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId) return next();
      
      // Пропускаем команду /start
      if (ctx.message?.text === '/start') return next();
      
      // Пропускаем callback от кнопок согласия
      if (ctx.callbackQuery?.data?.startsWith('privacy_')) return next();
      
      const user = SyncDataService.getUser(userId);
      
      // Если пользователя нет - просим начать с /start
      if (!user) {
        await ctx.reply(
          '⚠️ Пожалуйста, начните с команды /start',
          { reply_markup: { remove_keyboard: true } }
        );
        return;
      }
      
      // Если у пользователя нет согласия - показываем соглашение
      if (!user.privacyConsentAccepted) {
        await this.showPrivacyAgreement(ctx, userId);
        return;
      }
      
      // Если всё OK - продолжаем
      await next();
    });

    // Middleware для логирования
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const command = ctx.message?.text || ctx.callbackQuery?.data;
      
      SyncHelpers.log(
        `Пользователь ${userId} (@${username}): ${command || 'действие'}`,
        'info'
      );
      
      if (userId) {
        SyncDataService.saveUser(userId, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          lastActivity: new Date().toISOString(),
          isActive: true
        });
      }
      
      return next();
    });
  }

  // ==================== СИСТЕМА СОГЛАСИЯ ====================
  
  async showPrivacyAgreement(ctx, userId) {
    const privacyText = `🔐 *СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ*\n\n` +
      `Для использования бота необходимо ваше согласие на обработку персональных данных в соответствии с Федеральным законом №152-ФЗ.\n\n` +
      `*Что мы обрабатываем:*\n` +
      `• Ваш Telegram ID и имя пользователя\n` +
      `• Имя и фамилию (если указаны в профиле)\n` +
      `• Информацию, которую вы предоставляете в ходе использования бота\n` +
      `• Данные о ваших действиях и созданных документах\n\n` +
      `*Цели обработки:*\n` +
      `• Предоставление услуг по созданию юридических документов\n` +
      `• Хранение истории ваших дел и документов\n` +
      `• Улучшение качества сервиса\n` +
      `• Соблюдение законодательных требований\n\n` +
      `*Срок хранения:*\n` +
      `Данные хранятся в течение 3 лет с момента последней активности или до отзыва согласия.\n\n` +
      `*Полный текст соглашения:* [Скачать PDF](https://ваш-домен.ru/privacy.pdf)\n\n` +
      `*Нажимая "Принять", вы даете согласие на обработку персональных данных.*`;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Принимаю', 'privacy_accept'),
        Markup.button.callback('❌ Отказываюсь', 'privacy_decline')
      ]
    ]);
    
    await ctx.reply(privacyText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
      reply_markup: keyboard
    });
    
    SyncDataService.saveUser(userId, {
      step: 'awaiting_privacy_consent',
      lastActivity: new Date().toISOString()
    });
  }
  
  async handlePrivacyAccept(ctx, userId) {
    SyncDataService.savePrivacyConsent(userId, true);
    
    await ctx.answerCallbackQuery('✅ Согласие принято');
    await ctx.editMessageText(
      '✅ *Спасибо! Согласие принято.*\n\n' +
      'Теперь вы можете пользоваться всеми функциями бота. Для начала работы выберите действие в меню ниже.',
      { parse_mode: 'Markdown' }
    );
    
    await this.showMainMenu(ctx);
  }
  
  async handlePrivacyDecline(ctx, userId) {
    SyncDataService.savePrivacyConsent(userId, false);
    
    await ctx.answerCallbackQuery('❌ Согласие отклонено');
    await ctx.editMessageText(
      '❌ *Вы отказались от соглашения.*\n\n' +
      'К сожалению, без согласия на обработку персональных данных мы не можем предоставлять услуги бота.\n\n' +
      'Ваши данные не будут обрабатываться. Если передумаете - просто напишите /start',
      { parse_mode: 'Markdown' }
    );
  }

  // ==================== РЕГИСТРАЦИЯ КОМАНД ====================
  
  registerCommands() {
    // ========== КОМАНДА /start ==========
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from.id;
      
      let user = SyncDataService.getUser(userId);
      
      if (!user) {
        // Новый пользователь
        user = SyncDataService.saveUser(userId, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          languageCode: ctx.from.language_code,
          isActive: true,
          step: 'awaiting_privacy_consent',
          createdAt: new Date().toISOString(),
          referrals: 0,
          balance: 0
        });
        
        await ctx.reply(
          `👋 Добро пожаловать в *Юрист-Конструктор*!\n\n` +
          `Я помогу вам:\n` +
          `• Создавать юридические документы\n` +
          `• Управлять вашими делами\n` +
          `• Консультировать по правовым вопросам\n\n` +
          `*Прежде чем начать, пожалуйста, ознакомьтесь с соглашением об обработке персональных данных.*`,
          { parse_mode: 'Markdown' }
        );
        
        // Показываем соглашение через 2 секунды
        setTimeout(async () => {
          await this.showPrivacyAgreement(ctx, userId);
        }, 2000);
        
      } else if (!user.privacyConsentAccepted) {
        // Пользователь есть, но согласия нет
        await ctx.reply('Для продолжения работы необходимо принять соглашение об обработке персональных данных.');
        await this.showPrivacyAgreement(ctx, userId);
        
      } else {
        // Пользователь с согласием
        SyncDataService.saveUser(userId, {
          isActive: true,
          lastActivity: new Date().toISOString()
        });
        
        await ctx.reply(`🎉 С возвращением, ${user.firstName || 'друг'}!`);
        await this.showMainMenu(ctx);
      }
    });

    // ========== КОМАНДА /help ==========
    this.bot.command('help', (ctx) => {
      const helpText = `📚 *Помощь*\n\n` +
        `*Основные команды:*\n` +
        `/start - Начать работу с ботом\n` +
        `/help - Получить помощь\n` +
        `/menu - Показать меню\n` +
        `/privacy - Показать соглашение о конфиденциальности\n\n` +
        `*Функции бота:*\n` +
        `• Создание юридических документов\n` +
        `• Управление делами\n` +
        `• Консультации\n` +
        `• Шаблоны документов\n\n` +
        `*Поддержка:*\n` +
        `Если у вас возникли проблемы, напишите нам: ${SyncConfig.get('bot.supportChat')}`;
      
      ctx.reply(helpText, { parse_mode: 'Markdown' });
    });

    // ========== КОМАНДА /menu ==========
    this.bot.command('menu', (ctx) => {
      this.showMainMenu(ctx);
    });

    // ========== КОМАНДА /privacy ==========
    this.bot.command('privacy', async (ctx) => {
      const userId = ctx.from.id;
      const user = SyncDataService.getUser(userId);
      
      if (user?.privacyConsentAccepted) {
        const consentDate = SyncHelpers.formatDate(new Date(user.privacyConsentDate));
        await ctx.reply(
          `🔐 *Ваше согласие на обработку ПД*\n\n` +
          `✅ Вы приняли соглашение ${consentDate}\n` +
          `Для отзыва согласия напишите /revoke_consent`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await this.showPrivacyAgreement(ctx, userId);
      }
    });

    // ========== КОМАНДА /revoke_consent ==========
    this.bot.command('revoke_consent', async (ctx) => {
      const userId = ctx.from.id;
      const user = SyncDataService.getUser(userId);
      
      if (!user) {
        await ctx.reply('Вы не зарегистрированы в боте.');
        return;
      }
      
      if (!user.privacyConsentAccepted) {
        await ctx.reply('У вас нет активного согласия на обработку ПД.');
        return;
      }
      
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Да, отозвать', 'revoke_confirm'),
          Markup.button.callback('❌ Нет, оставить', 'revoke_cancel')
        ]
      ]);
      
      await ctx.reply(
        `⚠️ *Отзыв согласия на обработку ПД*\n\n` +
        `Вы уверены, что хотите отозвать согласие на обработку персональных данных?\n\n` +
        `*Это приведет к:*\n` +
        `• Прекращению обработки ваших данных\n` +
        `• Удалению ваших активных дел\n` +
        `• Блокировке доступа к боту\n\n` +
        `После отзыва вы сможете снова принять соглашение через /start`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    });

    // ========== КОМАНДА /privacy_stats (админ) ==========
    this.bot.command('privacy_stats', async (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        await ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      const stats = SyncDataService.getStats();
      
      const statsText = `📊 *Статистика согласий на обработку ПД*\n\n` +
        `👥 Всего пользователей: ${stats.totalUsers}\n` +
        `✅ Согласились: ${stats.usersWithConsent}\n` +
        `⏳ Без решения: ${stats.usersWithoutConsent}\n` +
        `❌ Отказались: ${stats.refusedConsent}\n\n` +
        `📈 Активных: ${stats.activeUsers}\n` +
        `📦 Заказов: ${stats.totalOrders}\n` +
        `📁 Дел: ${stats.totalCases}\n\n` +
        `🔄 Обновлено: ${SyncHelpers.formatDate(new Date(stats.lastUpdated))}`;
      
      await ctx.reply(statsText, { parse_mode: 'Markdown' });
    });

    // ========== КОМАНДА /stats (админ) ==========
    this.bot.command('stats', async (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        await ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      const stats = SyncDataService.getStats();
      
      const statsText = `📊 *Статистика бота*\n\n` +
        `👥 Пользователи:\n` +
        `   Всего: ${stats.totalUsers}\n` +
        `   Активных: ${stats.activeUsers}\n` +
        `   Согласия: ${stats.usersWithConsent}/${stats.totalUsers}\n\n` +
        `📦 Заказы: ${stats.totalOrders}\n` +
        `📁 Дела: ${stats.totalCases}\n\n` +
        `🔄 Обновлено: ${SyncHelpers.formatDate(new Date(stats.lastUpdated))}`;
      
      await ctx.reply(statsText, { parse_mode: 'Markdown' });
    });

    // ========== КОМАНДА /backup (админ) ==========
    this.bot.command('backup', async (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        await ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      await ctx.reply('🔄 Создание резервной копии...');
      
      const backupPath = SyncDataService.createBackup();
      
      if (backupPath) {
        await ctx.reply(`✅ Резервная копия создана успешно!\nПуть: \`${backupPath}\``, {
          parse_mode: 'Markdown'
        });
      } else {
        await ctx.reply('❌ Ошибка создания резервной копии.');
      }
    });

    // ========== КОМАНДА /users (админ) ==========
    this.bot.command('users', async (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        await ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      const allUsers = SyncDataService.getAllUsers();
      const usersList = Object.values(allUsers)
        .slice(0, 20)
        .map((user, index) => 
          `${index + 1}. ${user.firstName || 'Без имени'} (@${user.username || 'нет'}) ` +
          `${user.privacyConsentAccepted ? '✅' : '❌'} ` +
          `${SyncHelpers.formatDate(new Date(user.createdAt))}`
        )
        .join('\n');
      
      await ctx.reply(
        `👥 *Последние пользователи:*\n\n${usersList}\n\n` +
        `Всего пользователей: ${Object.keys(allUsers).length}`,
        { parse_mode: 'Markdown' }
      );
    });
  }

  async showMainMenu(ctx) {
    const keyboard = Markup.keyboard([
      ['📄 Создать документ', '📁 Мои дела'],
      ['⚖️ Консультация', '📋 Шаблоны'],
      ['⚙️ Настройки', '❓ Помощь']
    ]).resize();
    
    await ctx.reply(
      '🏠 *Главное меню*\n\n' +
      'Выберите действие:',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
    
    const userId = ctx.from.id;
    SyncDataService.updateUser(userId, { step: 'main_menu' });
    this.userStates[userId] = { step: 'main_menu' };
  }

  registerHandlers() {
    // ========== ОБРАБОТКА CALLBACK QUERY ==========
    this.bot.on('callback_query', async (ctx) => {
      await ctx.answerCbQuery();
      
      const callbackData = ctx.callbackQuery.data;
      const userId = ctx.from.id;
      
      // Обработка согласия на обработку ПД
      if (callbackData === 'privacy_accept') {
        await this.handlePrivacyAccept(ctx, userId);
      } 
      else if (callbackData === 'privacy_decline') {
        await this.handlePrivacyDecline(ctx, userId);
      }
      // Обработка отзыва согласия
      else if (callbackData === 'revoke_confirm') {
        await this.handleRevokeConfirm(ctx, userId);
      }
      else if (callbackData === 'revoke_cancel') {
        await ctx.editMessageText('❌ Отзыв согласия отменен.');
      }
      // Другие callback-обработчики
      else if (callbackData.startsWith('template_')) {
        const templateId = callbackData.replace('template_', '');
        await this.handleTemplateSelection(ctx, userId, templateId);
      }
      else if (callbackData.startsWith('case_')) {
        const caseId = callbackData.replace('case_', '');
        await this.handleCaseSelection(ctx, userId, caseId);
      }
    });
    
    // ========== ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ ==========
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id;
      const text = ctx.message.text;
      const user = SyncDataService.getUser(userId);
      
      if (!user || !user.privacyConsentAccepted) {
        await ctx.reply('Пожалуйста, сначала примите соглашение через /start');
        return;
      }
      
      const userState = this.userStates[userId] || { step: 'main_menu' };
      
      switch (userState.step) {
        case 'awaiting_document_name':
          await this.handleDocumentName(ctx, userId, text);
          break;
          
        case 'awaiting_document_description':
          await this.handleDocumentDescription(ctx, userId, text);
          break;
          
        default:
          await this.handleMainMenuSelection(ctx, userId, text);
      }
    });
  }
  
  async handleRevokeConfirm(ctx, userId) {
    // Отзыв согласия
    SyncDataService.savePrivacyConsent(userId, false);
    
    // Удаляем дела пользователя
    const userCases = SyncDataService.getUserCases(userId);
    for (const userCase of userCases) {
      // Можно пометить как удаленные, а не удалять физически
      SyncDataService.updateCase(userCase.id, {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletionReason: 'consent_revoked'
      });
    }
    
    await ctx.editMessageText(
      '✅ *Согласие отозвано*\n\n' +
      'Ваше согласие на обработку персональных данных отозвано.\n' +
      '• Обработка ваших данных прекращена\n' +
      '• Ваши активные дела помечены как удаленные\n' +
      '• Доступ к боту заблокирован\n\n' +
      'Если передумаете, вы можете снова принять соглашение через команду /start',
      { parse_mode: 'Markdown' }
    );
  }
  
  async handleMainMenuSelection(ctx, userId, text) {
    switch (text) {
      case '📄 Создать документ':
        await this.showDocumentTypes(ctx);
        break;
        
      case '📁 Мои дела':
        await this.showUserCases(ctx, userId);
        break;
        
      case '⚖️ Консультация':
        await ctx.reply(
          '⚖️ *Юридическая консультация*\n\n' +
          'Опишите ваш вопрос, и наш юрист свяжется с вами в течение 24 часов.\n\n' +
          'Стоимость: 500 руб./вопрос\n' +
          'Для начала напишите ваш вопрос:',
          { parse_mode: 'Markdown' }
        );
        this.userStates[userId] = { step: 'awaiting_consultation' };
        break;
        
      case '📋 Шаблоны':
        await this.showTemplates(ctx);
        break;
        
      case '⚙️ Настройки':
        await this.showSettings(ctx, userId);
        break;
        
      case '❓ Помощь':
        await ctx.reply(
          '❓ *Помощь*\n\n' +
          'Если у вас возникли проблемы:\n' +
          '1. Перезапустите бота командой /start\n' +
          '2. Проверьте подключение к интернету\n' +
          '3. Напишите в поддержку: @support\n\n' +
          'Частые вопросы:\n' +
          '• Как создать документ? - Используйте пункт "Создать документ"\n' +
          '• Где мои документы? - В разделе "Мои дела"\n' +
          '• Как связаться с юристом? - Раздел "Консультация"',
          { parse_mode: 'Markdown' }
        );
        break;
        
      default:
        await ctx.reply('Используйте меню для навигации.');
    }
  }

  async showDocumentTypes(ctx) {
    const templates = SyncDataService.getAllTemplates();
    
    let message = '📄 *Выберите тип документа:*\n\n';
    const keyboard = [];
    
    for (const category in templates) {
      const categoryName = this.getCategoryName(category);
      message += `*${categoryName}:*\n`;
      
      templates[category].forEach(template => {
        message += `  • ${template.name}\n`;
        
        keyboard.push([
          Markup.button.callback(template.name, `template_${template.id}`)
        ]);
      });
      
      message += '\n';
    }
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(keyboard)
    });
  }
  
  async handleTemplateSelection(ctx, userId, templateId) {
    const template = SyncDataService.getTemplateById(templateId);
    
    if (!template) {
      await ctx.reply('❌ Шаблон не найден.');
      return;
    }
    
    this.userStates[userId] = {
      step: 'awaiting_document_name',
      selectedTemplate: template
    };
    
    await ctx.reply(
      `✅ Вы выбрали: *${template.name}*\n\n` +
      `Теперь введите название вашего документа:\n` +
      `(Например: "Договор аренды квартиры")`,
      { parse_mode: 'Markdown' }
    );
  }
  
  async handleDocumentName(ctx, userId, documentName) {
    const userState = this.userStates[userId];
    const caseData = {
      userId: userId,
      documentName: documentName,
      templateId: userState.selectedTemplate.id,
      templateName: userState.selectedTemplate.name,
      status: 'draft',
      documents: []
    };
    
    const newCase = SyncDataService.createCase(caseData);
    
    this.userStates[userId] = {
      step: 'awaiting_document_description',
      caseId: newCase.id
    };
    
    await ctx.reply(
      `📁 Дело *"${documentName}"* создано!\n\n` +
      `Теперь опишите детали вашего дела:\n` +
      `(Что должно быть указано в документе?)`,
      { parse_mode: 'Markdown' }
    );
  }
  
  async handleDocumentDescription(ctx, userId, description) {
    const userState = this.userStates[userId];
    
    if (!userState.caseId) {
      await ctx.reply('❌ Ошибка: дело не найдено.');
      return;
    }
    
    SyncDataService.updateCase(userState.caseId, {
      description: description,
      status: 'in_progress'
    });
    
    this.userStates[userId] = { step: 'main_menu' };
    SyncDataService.updateUser(userId, { step: 'main_menu' });
    
    await ctx.reply(
      `✅ Описание добавлено!\n\n` +
      `Ваше дело передано на обработку.\n` +
      `Мы уведомим вас, когда документ будет готов.\n\n` +
      `ID дела: \`${userState.caseId}\``,
      { 
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      }
    );
    
    await this.showMainMenu(ctx);
  }
  
  async showUserCases(ctx, userId) {
    const cases = SyncDataService.getUserCases(userId);
    
    if (cases.length === 0) {
      await ctx.reply(
        '📁 У вас пока нет дел.\n\n' +
        'Чтобы создать первое дело, выберите "Создать документ" в главном меню.'
      );
      return;
    }
    
    let message = '📁 *Ваши дела:*\n\n';
    const keyboard = [];
    
    cases.slice(0, 10).forEach(c => {
      const statusIcon = this.getStatusIcon(c.status);
      message += `${statusIcon} *${c.documentName}*\n`;
      message += `   Статус: ${this.getStatusText(c.status)}\n`;
      message += `   Создано: ${SyncHelpers.formatDate(new Date(c.createdAt))}\n\n`;
      
      keyboard.push([
        Markup.button.callback(
          `📄 ${c.documentName.substring(0, 20)}...`,
          `case_${c.id}`
        )
      ]);
    });
    
    if (cases.length > 10) {
      message += `... и еще ${cases.length - 10} дел`;
    }
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(keyboard)
    });
  }
  
  async showTemplates(ctx) {
    const templates = SyncDataService.getAllTemplates();
    
    let message = '📋 *Доступные шаблоны:*\n\n';
    let count = 0;
    
    for (const category in templates) {
      const categoryName = this.getCategoryName(category);
      message += `*${categoryName}:*\n`;
      
      templates[category].forEach(template => {
        count++;
        message += `  ${count}. ${template.name}\n`;
      });
      
      message += '\n';
    }
    
    message += `Всего шаблонов: ${count}\n\n`;
    message += 'Для использования шаблона выберите "Создать документ" в главном меню.';
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
  
  async showSettings(ctx, userId) {
    const user = SyncDataService.getUser(userId);
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          user.notifications ? '🔔 Уведомления: ВКЛ' : '🔕 Уведомления: ВЫКЛ',
          'toggle_notifications'
        )
      ],
      [
        Markup.button.callback('🌐 Язык', 'change_language'),
        Markup.button.callback('👤 Профиль', 'show_profile')
      ],
      [
        Markup.button.callback('📊 Статистика', 'user_stats'),
        Markup.button.callback('🔐 Конфиденциальность', 'privacy_settings')
      ]
    ]);
    
    const consentStatus = user.privacyConsentAccepted ? 
      `✅ Принято ${SyncHelpers.formatDate(new Date(user.privacyConsentDate))}` : 
      '❌ Не принято';
    
    await ctx.reply(
      `⚙️ *Настройки*\n\n` +
      `👤 *Профиль:*\n` +
      `   Имя: ${user.firstName || 'Не указано'}\n` +
      `   Логин: @${user.username || 'Не указан'}\n` +
      `   Зарегистрирован: ${SyncHelpers.formatDate(new Date(user.createdAt))}\n\n` +
      `🔐 *Конфиденциальность:*\n` +
      `   Согласие на ПД: ${consentStatus}\n\n` +
      `📊 *Статистика:*\n` +
      `   Дел создано: ${SyncDataService.getUserCases(userId).length}\n` +
      `   Активность: ${user.isActive ? 'Активен' : 'Неактивен'}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  }
  
  getCategoryName(category) {
    const categories = {
      contracts: 'Договоры',
      claims: 'Исковые заявления',
      powers: 'Доверенности',
      statements: 'Заявления'
    };
    return categories[category] || category;
  }
  
  getStatusIcon(status) {
    const icons = {
      draft: '📝',
      in_progress: '🔄',
      ready: '✅',
      completed: '🏁',
      cancelled: '❌',
      deleted: '🗑️'
    };
    return icons[status] || '📌';
  }
  
  getStatusText(status) {
    const texts = {
      draft: 'Черновик',
      in_progress: 'В работе',
      ready: 'Готов',
      completed: 'Завершено',
      cancelled: 'Отменено',
      deleted: 'Удалено'
    };
    return texts[status] || status;
  }
  
  setupErrorHandling() {
    this.bot.catch((error, ctx) => {
      console.error('❌ Ошибка бота:', error);
      
      SyncHelpers.handleError(error, 'Ошибка в боте');
      
      try {
        ctx.reply(
          '⚠️ Произошла ошибка. Пожалуйста, попробуйте позже.\n' +
          'Мы уже работаем над устранением проблемы.'
        );
      } catch (e) {
        console.error('Не удалось отправить сообщение об ошибке:', e);
      }
    });
  }
  
  start() {
    if (this.isRunning) {
      console.log('Бот уже запущен');
      return;
    }
    
    try {
      console.log('🤖 Запуск бота...');
      this.bot.launch();
      this.isRunning = true;
      
      console.log('✅ Бот успешно запущен!');
      
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
      
      if (SyncConfig.get('features.backupEnabled')) {
        this.startAutoBackup();
      }
      
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error);
      throw error;
    }
  }
  
  startAutoBackup() {
    const intervalHours = SyncConfig.get('features.backupInterval', 24);
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(() => {
      console.log('🔄 Запуск автоматического бэкапа...');
      SyncDataService.createBackup();
    }, intervalMs);
    
    console.log(`✅ Автоматический бэкап настроен (каждые ${intervalHours} часов)`);
  }
  
  stop(signal) {
    console.log(`🛑 Остановка бота (${signal})...`);
    this.isRunning = false;
    
    try {
      if (this.bot) {
        this.bot.stop(signal);
      }
      console.log('👋 Бот остановлен');
    } catch (error) {
      console.error('Ошибка остановки бота:', error);
    }
    
    SyncDataService.createBackup();
    process.exit(0);
  }
}

module.exports = SyncBot;