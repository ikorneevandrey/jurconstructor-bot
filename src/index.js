// src/index.js
require('dotenv').config();
console.log('Token from env:', process.env.BOT_TOKEN || 'NOT FOUND'); // Для отладки

const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

// Обработчик команды /start
bot.start(async (ctx) => {
  const user = ctx.from;

  // Отправляем пользователю текст политики конфиденциальности и запрашиваем согласие
  const consentMessage = `Добро пожаловать в Smart_JuristBot! 🧑‍💼

Для начала работы и создания юридических документов мне необходимо обрабатывать ваши данные: идентификатор Telegram, имя и username.

Ознакомьтесь с нашей Политикой конфиденциальности: [ваша_ссылка_на_политику]

Вы согласны на обработку ваших персональных данных?`;

  // Отправляем сообщение с инлайн-кнопками "Согласен" и "Не согласен"
  ctx.reply(consentMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Согласен", callback_data: "consent_given" },
          { text: "❌ Не согласен", callback_data: "consent_denied" }
        ]
      ]
    }
  });
});

// Обработчик нажатия на кнопку согласия
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'consent_given') {
    // Только после получения согласия сохраняем данные
    const user = ctx.from;
    try {
      await saveUser(user.id, {
        firstName: user.first_name,
        username: user.username,
        joined: new Date().toISOString(),
        consentGiven: true, // Сохраняем факт получения согласия
        consentDate: new Date().toISOString() // и дату
      });
      ctx.editMessageText("Спасибо! Теперь вы можете пользоваться ботом. Используйте /menu для главного меню.");
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
      ctx.editMessageText("Произошла ошибка при сохранении ваших данных. Пожалуйста, попробуйте позже.");
    }
    ctx.answerCbQuery();
  } else if (data === 'consent_denied') {
    ctx.editMessageText("Вы не дали согласие на обработку данных. К сожалению, функционал бота вам недоступен.");
    ctx.answerCbQuery();
  } else if (data.startsWith('category_')) {
    // Обработчик выбора категории (существующий функционал)
    ctx.reply(`Вы выбрали: ${data.split('_')[1]}. Эта функция в разработке.`);
    ctx.answerCbQuery();
  }
});

// Обработчик команды /profile
bot.command('profile', async (ctx) => {
  try {
    // Используем новую функцию getUser, которая работает с Back4app
    const userData = await getUser(ctx.from.id);
    if (userData) {
      ctx.reply(`Ваш профиль:\nID: ${userData.telegramId}\nИмя: ${userData.firstName}\nUsername: @${userData.username}\nЗарегистрирован: ${new Date(userData.joined).toLocaleDateString()}`);
    } else {
      ctx.reply('Профиль не найден. Отправьте /start для регистрации.');
    }
  } catch (error) {
    console.error('Ошибка в /profile:', error);
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

// Запускаем бота 
bot.launch().then(() => { 
  console.log('Бот успешно запущен!'); 
});

// Правильно завершаем работу при остановке 
process.once('SIGINT', () => bot.stop('SIGINT')); 
process.once('SIGTERM', () => bot.stop('SIGTERM'));