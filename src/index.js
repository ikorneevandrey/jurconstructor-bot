// src/index.js
const { Telegraf } = require('telegraf');
const { init, saveUser, getUser } = require('./utils/database');

// Инициализируем базу при запуске
init().then(() => {
  console.log('База данных готова');
});

// Вставьте свой токен который получили от BotFather 
const bot = new Telegraf('8266292436:AAHoha-hSeRNQECESIlZeUhPddQwdFOKyCQ'); // Замените на реальный токен

// Обработчик команды /start 
bot.start(async (ctx) => { 
  try {
    const user = ctx.from;
    await saveUser(user.id, {
      firstName: user.first_name,
      username: user.username,
      joined: new Date().toISOString()
    });
    ctx.reply(`Добро пожаловать, ${user.first_name}! Я помогу вам создать юридические документы.`);
    ctx.reply('Используйте /menu для главного меню');
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error);
    ctx.reply('Произошла ошибка при сохранении ваших данных.');
  }
}); 

// Обработчик команды /help 
bot.help((ctx) => { 
  ctx.reply('Это бот для создания юридических документов. Используйте /start чтобы начать.'); 
}); 

// Обработчик команды /profile
bot.command('profile', async (ctx) => {
  try {
    const userData = await getUser(ctx.from.id);
    if (userData) {
      ctx.reply(`Ваш профиль:\nИмя: ${userData.firstName}\nUsername: @${userData.username}\nДата регистрации: ${new Date(userData.joined).toLocaleDateString()}`);
    } else {
      ctx.reply('Профиль не найден. Отправьте /start для регистрации.');
    }
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    ctx.reply('Произошла ошибка при получении профиля.');
  }
});

// Создаем главное меню
bot.command('menu', (ctx) => { 
  ctx.reply('Выберите действие:', { 
    reply_markup: { 
      keyboard: [ 
        ['📄 Создать документ'],
        ['📋 Мои заказы', '👤 Мой профиль'],
        ['❓ Помощь', '📞 Поддержка']
      ], 
      resize_keyboard: true 
    } 
  }); 
}); 

// Обработчик кнопки "Создать документ" 
bot.hears('📄 Создать документ', (ctx) => { 
  ctx.reply('Выберите тип документа:', { 
    reply_markup: { 
      inline_keyboard: [ 
        [ 
          { text: 'Претензии', callback_data: 'category_claim' }, 
          { text: 'Жалобы', callback_data: 'category_complaint' } 
        ], 
        [ 
          { text: 'Ходатайства', callback_data: 'category_petition' }, 
          { text: 'Исковые заявления', callback_data: 'category_lawsuit' } 
        ] 
      ] 
    } 
  }); 
}); 

// Обработчик выбора категории 
bot.on('callback_query', (ctx) => { 
  const data = ctx.callbackQuery.data; 
  if (data.startsWith('category_')) { 
    ctx.reply(`Вы выбрали: ${data.split('_')[1]}. Эта функция в разработке.`);
    ctx.answerCbQuery(); 
  } 
}); 

// Запускаем бота 
bot.launch().then(() => { 
  console.log('Бот успешно запущен!'); 
}); 

// Правильно завершаем работу при остановке 
process.once('SIGINT', () => bot.stop('SIGINT')); 
process.once('SIGTERM', () => bot.stop('SIGTERM'));