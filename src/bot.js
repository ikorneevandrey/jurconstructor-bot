const { Telegraf, Markup } = require('telegraf');
const SyncDataService = require('./services/SyncDataService');
const SyncConfig = require('./config/syncConfig');
const SyncHelpers = require('./utils/syncHelpers');

class SyncBot {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.userStates = {}; // Состояния пользователей в памяти
  }

  initialize() {
    try {
      console.log('🚀 Инициализация синхронного бота...');
      
      // Загружаем конфигурацию
      const config = SyncConfig.getAll();
      console.log(`🤖 Бот: ${config.bot.name} v${config.bot.version}`);
      
      // Проверяем токен
      const token = process.env.BOT_TOKEN;
      if (!token) {
        throw new Error('BOT_TOKEN не найден в переменных окружения');
      }
      
      // Инициализируем бота
      this.bot = new Telegraf(token);
      
      // Инициализируем базу данных
      SyncDataService.init();
      
      // Настраиваем middleware
      this.setupMiddlewares();
      
      // Регистрируем команды
      this.registerCommands();
      
      // Регистрируем обработчики
      this.registerHandlers();
      
      // Настраиваем обработку ошибок
      this.setupErrorHandling();
      
      console.log('✅ Бот инициализирован успешно');
      return this;
      
    } catch (error) {
      console.error('❌ Ошибка инициализации бота:', error);
      throw error;
    }
  }

  setupMiddlewares() {
    // Middleware для логирования
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const command = ctx.message?.text || ctx.callbackQuery?.data;
      
      SyncHelpers.log(
        `Пользователь ${userId} (@${username}): ${command || 'действие'}`,
        'info'
      );
      
      // Обновляем активность пользователя
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

  registerCommands() {
    // ========== КОМАНДА /start ==========
    this.bot.command('start', (ctx) => {
      const userId = ctx.from.id;
      
      // Получаем пользователя (синхронно)
      const user = SyncDataService.getUser(userId);
      
      if (!user) {
        // Регистрируем нового пользователя
        const newUser = SyncDataService.saveUser(userId, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          languageCode: ctx.from.language_code,
          isActive: true,
          step: 'main_menu',
          createdAt: new Date().toISOString(),
          referrals: 0,
          balance: 0
        });
        
        ctx.reply(
          `👋 Добро пожаловать в *Юрист-Конструктор*!\n\n` +
          `Я помогу вам:\n` +
          `• Создавать юридические документы\n` +
          `• Управлять вашими делами\n` +
          `• Консультировать по правовым вопросам\n\n` +
          `Используйте меню ниже для навигации.`,
          { parse_mode: 'Markdown' }
        );
      } else {
        // Приветствуем существующего пользователя
        SyncDataService.updateUser(userId, {
          isActive: true,
          lastActivity: new Date().toISOString()
        });
        
        ctx.reply(
          `🎉 С возвращением, *${user.firstName || 'друг'}*!\n` +
          `Рад снова вас видеть.`,
          { parse_mode: 'Markdown' }
        );
      }
      
      // Показываем главное меню
      this.showMainMenu(ctx);
    });

    // ========== КОМАНДА /help ==========
    this.bot.command('help', (ctx) => {
      const helpText = `📚 *Помощь*\n\n` +
        `*Основные команды:*\n` +
        `/start - Начать работу с ботом\n` +
        `/help - Получить помощь\n` +
        `/menu - Показать меню\n` +
        `/docs - Документация\n\n` +
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

    // ========== КОМАНДА /docs ==========
    this.bot.command('docs', (ctx) => {
      ctx.reply(
        `📖 *Документация*\n\n` +
        `1. *Создание документа:*\n` +
        `   - Выберите тип документа\n` +
        `   - Заполните форму\n` +
        `   - Получите готовый документ\n\n` +
        `2. *Управление делами:*\n` +
        `   - Создавайте дела\n` +
        `   - Добавляйте документы\n` +
        `   - Отслеживайте статус\n\n` +
        `3. *Шаблоны:*\n` +
        `   - Более 50 готовых шаблонов\n` +
        `   - Постоянное обновление\n\n` +
        `*Для начала работы нажмите /start*`,
        { parse_mode: 'Markdown' }
      );
    });

    // ========== КОМАНДА /stats (админ) ==========
    this.bot.command('stats', (ctx) => {
      const userId = ctx.from.id;
      
      // Проверяем права админа
      if (!SyncConfig.isAdmin(userId)) {
        ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      // Получаем статистику
      const stats = SyncDataService.getStats();
      
      const statsText = `📊 *Статистика бота*\n\n` +
        `👥 Пользователи:\n` +
        `   Всего: ${stats.totalUsers}\n` +
        `   Активных: ${stats.activeUsers}\n\n` +
        `📦 Заказы: ${stats.totalOrders}\n` +
        `📁 Дела: ${stats.totalCases}\n\n` +
        `🔄 Обновлено: ${SyncHelpers.formatDate(new Date(stats.lastUpdated))}`;
      
      ctx.reply(statsText, { parse_mode: 'Markdown' });
    });

    // ========== КОМАНДА /backup (админ) ==========
    this.bot.command('backup', (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      ctx.reply('🔄 Создание резервной копии...');
      
      // Создаем бэкап
      const backupPath = SyncDataService.createBackup();
      
      if (backupPath) {
        ctx.reply(`✅ Резервная копия создана успешно!\nПуть: \`${backupPath}\``, {
          parse_mode: 'Markdown'
        });
      } else {
        ctx.reply('❌ Ошибка создания резервной копии.');
      }
    });

    // ========== КОМАНДА /users (админ) ==========
    this.bot.command('users', (ctx) => {
      const userId = ctx.from.id;
      
      if (!SyncConfig.isAdmin(userId)) {
        ctx.reply('⛔ У вас нет прав для этой команды.');
        return;
      }
      
      const allUsers = SyncDataService.getAllUsers();
      const usersList = Object.values(allUsers)
        .slice(0, 20) // Первые 20 пользователей
        .map((user, index) => 
          `${index + 1}. ${user.firstName || 'Без имени'} (@${user.username || 'нет'}) - ${SyncHelpers.formatDate(new Date(user.createdAt))}`
        )
        .join('\n');
      
      ctx.reply(
        `👥 *Последние пользователи:*\n\n${usersList}\n\n` +
        `Всего пользователей: ${Object.keys(allUsers).length}`,
        { parse_mode: 'Markdown' }
      );
    });
  }

  showMainMenu(ctx) {
    const keyboard = Markup.keyboard([
      ['📄 Создать документ', '📁 Мои дела'],
      ['⚖️ Консультация', '📋 Шаблоны'],
      ['⚙️ Настройки', '❓ Помощь']
    ]).resize();
    
    ctx.reply(
      '🏠 *Главное меню*\n\n' +
      'Выберите действие:',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
    
    // Сохраняем состояние пользователя
    const userId = ctx.from.id;
    SyncDataService.updateUser(userId, { step: 'main_menu' });
    this.userStates[userId] = { step: 'main_menu' };
  }

  registerHandlers() {
    // ========== ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ ==========
    this.bot.on('text', (ctx) => {
      const userId = ctx.from.id;
      const text = ctx.message.text;
      const user = SyncDataService.getUser(userId);
      
      // Проверяем состояние пользователя
      const userState = this.userStates[userId] || { step: 'main_menu' };
      
      switch (userState.step) {
        case 'awaiting_document_name':
          this.handleDocumentName(ctx, userId, text);
          break;
          
        case 'awaiting_document_description':
          this.handleDocumentDescription(ctx, userId, text);
          break;
          
        default:
          // Обработка кнопок главного меню
          this.handleMainMenuSelection(ctx, userId, text);
      }
    });

    // ========== ОБРАБОТКА CALLBACK QUERY ==========
    this.bot.on('callback_query', (ctx) => {
      // Отвечаем на callback
      ctx.answerCbQuery().catch(() => {});
      
      const callbackData = ctx.callbackQuery.data;
      const userId = ctx.from.id;
      
      // Обрабатываем callback
      if (callbackData.startsWith('template_')) {
        const templateId = callbackData.replace('template_', '');
        this.handleTemplateSelection(ctx, userId, templateId);
      }
      else if (callbackData.startsWith('case_')) {
        const caseId = callbackData.replace('case_', '');
        this.handleCaseSelection(ctx, userId, caseId);
      }
      else if (callbackData === 'create_new_document') {
        this.showDocumentTypes(ctx);
      }
    });
  }

  handleMainMenuSelection(ctx, userId, text) {
    switch (text) {
      case '📄 Создать документ':
        this.showDocumentTypes(ctx);
        break;
        
      case '📁 Мои дела':
        this.showUserCases(ctx, userId);
        break;
        
      case '⚖️ Консультация':
        ctx.reply(
          '⚖️ *Юридическая консультация*\n\n' +
          'Опишите ваш вопрос, и наш юрист свяжется с вами в течение 24 часов.\n\n' +
          'Стоимость: 500 руб./вопрос\n' +
          'Для начала напишите ваш вопрос:',
          { parse_mode: 'Markdown' }
        );
        this.userStates[userId] = { step: 'awaiting_consultation' };
        break;
        
      case '📋 Шаблоны':
        this.showTemplates(ctx);
        break;
        
      case '⚙️ Настройки':
        this.showSettings(ctx, userId);
        break;
        
      case '❓ Помощь':
        ctx.reply(
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
        ctx.reply('Используйте меню для навигации.');
    }
  }

  showDocumentTypes(ctx) {
    const templates = SyncDataService.getAllTemplates();
    
    let message = '📄 *Выберите тип документа:*\n\n';
    const keyboard = [];
    
    // Добавляем категории
    for (const category in templates) {
      const categoryName = this.getCategoryName(category);
      message += `*${categoryName}:*\n`;
      
      templates[category].forEach(template => {
        message += `  • ${template.name}\n`;
        
        keyboard.push([
          Markup.button.callback(
            template.name,
            `template_${template.id}`
          )
        ]);
      });
      
      message += '\n';
    }
    
    // Добавляем кнопку для создания нового
    keyboard.push([
      Markup.button.callback('➕ Создать новый тип', 'create_new_document')
    ]);
    
    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(keyboard)
    });
  }

  handleTemplateSelection(ctx, userId, templateId) {
    const template = SyncDataService.getTemplateById(templateId);
    
    if (!template) {
      ctx.reply('❌ Шаблон не найден.');
      return;
    }
    
    // Сохраняем выбор пользователя
    this.userStates[userId] = {
      step: 'awaiting_document_name',
      selectedTemplate: template
    };
    
    ctx.reply(
      `✅ Вы выбрали: *${template.name}*\n\n` +
      `Теперь введите название вашего документа:\n` +
      `(Например: "Договор аренды квартиры")`,
      { parse_mode: 'Markdown' }
    );
  }

  handleDocumentName(ctx, userId, documentName) {
    // Создаем новое дело
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
    
    // Обновляем состояние пользователя
    this.userStates[userId] = {
      step: 'awaiting_document_description',
      caseId: newCase.id
    };
    
    ctx.reply(
      `📁 Дело *"${documentName}"* создано!\n\n` +
      `Теперь опишите детали вашего дела:\n` +
      `(Что должно быть указано в документе?)`,
      { parse_mode: 'Markdown' }
    );
  }

  handleDocumentDescription(ctx, userId, description) {
    const userState = this.userStates[userId];
    
    if (!userState.caseId) {
      ctx.reply('❌ Ошибка: дело не найдено.');
      return;
    }
    
    // Обновляем дело
    SyncDataService.updateCase(userState.caseId, {
      description: description,
      status: 'in_progress'
    });
    
    // Сбрасываем состояние
    this.userStates[userId] = { step: 'main_menu' };
    SyncDataService.updateUser(userId, { step: 'main_menu' });
    
    ctx.reply(
      `✅ Описание добавлено!\n\n` +
      `Ваше дело передано на обработку.\n` +
      `Мы уведомим вас, когда документ будет готов.\n\n` +
      `ID дела: \`${userState.caseId}\``,
      { 
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      }
    );
    
    // Показываем главное меню
    this.showMainMenu(ctx);
  }

  showUserCases(ctx, userId) {
    const cases = SyncDataService.getUserCases(userId);
    
    if (cases.length === 0) {
      ctx.reply(
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
    
    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(keyboard)
    });
  }

  showTemplates(ctx) {
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
    
    ctx.reply(message, { parse_mode: 'Markdown' });
  }

  showSettings(ctx, userId) {
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
        Markup.button.callback('🗑️ Удалить данные', 'delete_data')
      ]
    ]);
    
    ctx.reply(
      `⚙️ *Настройки*\n\n` +
      `👤 *Профиль:*\n` +
      `   Имя: ${user.firstName || 'Не указано'}\n` +
      `   Логин: @${user.username || 'Не указан'}\n` +
      `   Зарегистрирован: ${SyncHelpers.formatDate(new Date(user.createdAt))}\n\n` +
      `📊 *Статистика:*\n` +
      `   Дел создано: ${SyncDataService.getUserCases(userId).length}\n` +
      `   Активность: ${user.isActive ? 'Активен' : 'Неактивен'}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  }

  // Вспомогательные методы
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
      cancelled: '❌'
    };
    
    return icons[status] || '📌';
  }

  getStatusText(status) {
    const texts = {
      draft: 'Черновик',
      in_progress: 'В работе',
      ready: 'Готов',
      completed: 'Завершено',
      cancelled: 'Отменено'
    };
    
    return texts[status] || status;
  }

  setupErrorHandling() {
    this.bot.catch((error, ctx) => {
      console.error('❌ Ошибка бота:', error);
      
      // Логируем ошибку
      SyncHelpers.handleError(error, 'Ошибка в боте');
      
      // Уведомляем пользователя
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
      
      // Graceful shutdown
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
      
      // Автоматическое резервное копирование
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
    
    // Создаем финальный бэкап
    SyncDataService.createBackup();
    
    process.exit(0);
  }
}

module.exports = SyncBot;