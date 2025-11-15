// index.js - финальная версия с улучшенной отладкой и стабильностью

// 1️⃣ Загрузка dotenv первой строкой
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('=== DEBUG VERSION 2025-11-15 ===');
console.log('Node version:', process.version);
console.log('DEBUG: BOT_TOKEN =', process.env.BOT_TOKEN?.slice(0, 10) + '...'); // не выводим полностью токен

if (!process.env.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is required!');
  process.exit(1);
}

// 2️⃣ Импорты
const { Telegraf } = require('telegraf');
const fs = require('fs');

// 3️⃣ Проверка структуры проекта
try {
  console.log('Files in project root:', fs.readdirSync('.'));
  console.log('Files in src:', fs.readdirSync('./src'));
} catch (err) {
  console.log('Error reading files:', err.message);
}

// 4️⃣ Заглушки для базы данных (позже заменить на реальную БД)
async function saveUser(userId, userData) {
  console.log('Saving user:', userId, userData);
  return true;
}

async function getUser(userId) {
  console.log('Fetching user:', userId);
  return {
    telegramId: userId,
    firstName: 'Test User',
    username: 'testuser',
    joined: new Date().toISOString()
  };
}

// 5️⃣ Создание бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// 6️⃣ Команда /start
bot.start(async (ctx) => {
  const consentMessage = `Добро пожаловать в Smart_JuristBot! 🧑‍💼

Для начала работы необходимо согласие на обработку данных (Telegram ID, имя, username).

Политика конфиденциальности: [ваша_ссылка]`;

  await ctx.reply(consentMessage, {
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

// 7️⃣ Обработчик inline-кнопок
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  try {
    if (data === 'consent_given') {
      const user = ctx.from;
      await saveUser(user.id, {
        firstName: user.first_name,
        username: user.username,
        joined: new Date().toISOString(),
        consentGiven: true,
        consentDate: new Date().toISOString()
      });
      await ctx.editMessageText("Спасибо! Теперь вы можете пользоваться ботом. Используйте /menu для главного меню.");
    } else if (data === 'consent_denied') {
      await ctx.editMessageText("Вы не дали согласие. Функционал бота недоступен.");
    } else if (data.startsWith('category_')) {
      await ctx.reply(`Вы выбрали: ${data.split('_')[1]}. Эта функция в разработке.`);
    }
    await ctx.answerCbQuery();
  } catch (err) {
    console.error('Callback query error:', err);
  }
});

// 8️⃣ Команда /profile
bot.command('profile', async (ctx) => {
  try {
    const userData = await getUser(ctx.from.id);
    if (userData) {
      await ctx.reply(`Ваш профиль:\nID: ${userData.telegramId}\nИмя: ${userData.firstName}\nUsername: @${userData.username}\nЗарегистрирован: ${new Date(userData.joined).toLocaleDateString()}`);
    } else {
      await ctx.reply('Профиль не найден. Отправьте /start для регистрации.');
    }
  } catch (err) {
    console.error('Error in /profile:', err);
    await ctx.reply('Произошла ошибка при получении профиля.');
  }
});

// 9️⃣ Команда /menu
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

// 🔟 Кнопка "Создать документ"
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

// 1️⃣1️⃣ Запуск бота
bot.launch()
  .then(() => console.log('=== BOT STARTED SUCCESSFULLY ==='))
  .catch((err) => {
    console.error('BOT STARTUP ERROR:', err);
    process.exit(1);
  });

// 1️⃣2️⃣ Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
