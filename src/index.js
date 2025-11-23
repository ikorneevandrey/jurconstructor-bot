// ==========================================
// index.js — Серверная версия с JSON-хранилищем
// Готов для последующей синхронизации с PostgreSQL
// ==========================================

// 1️⃣ Загрузка .env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 2️⃣ Импорты
const fs = require('fs');
const { Telegraf } = require('telegraf');

// Локальное хранилище JSON
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Создание файлов при отсутствии
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');

// 3️⃣ Функции работы с JSON
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function saveUser(id, data) {
  const users = readJSON(USERS_FILE);
  users[id] = data;
  writeJSON(USERS_FILE, users);
}

function getUser(id) {
  const users = readJSON(USERS_FILE);
  return users[id] || null;
}

// 4️⃣ PostgreSQL конфиг (пока НЕ используется)
const PG_CONFIG = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
};

// Это только резерв под будущую синхронизацию:
// console.log("PG config loaded:", PG_CONFIG);

// 5️⃣ Проверка токена
if (!process.env.BOT_TOKEN) {
  console.error("❌ ERROR: BOT_TOKEN missing in .env");
  process.exit(1);
}

// 6️⃣ Создание бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// =============================
// 7️⃣ Команда /start — согласие
// =============================
bot.start(async (ctx) => {
  const consentMessage = `Добро пожаловать в Smart_JuristBot! 🧑‍💼

Для работы необходимо согласие на обработку минимальных данных:
• Telegram ID
• Имя
• Username

Политика конфиденциальности:
https://disk.yandex.ru/i/iN8LYPvxzELuOg`;

  await ctx.reply(consentMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Согласен', callback_data: 'consent_given' },
          { text: '❌ Не согласен', callback_data: 'consent_denied' }
        ]
      ]
    }
  });
});

// =============================
// 8️⃣ Обработка согласия
// =============================
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'consent_given') {
    const user = ctx.from;

    const userData = {
      telegramId: user.id,
      firstName: user.first_name || '',
      username: user.username || '',
      joined: new Date().toISOString(),
      consentGiven: true,
      consentDate: new Date().toISOString()
    };

    saveUser(user.id, userData);

    await ctx.editMessageText('Спасибо! Теперь используйте команду /menu.');
  }

  if (data === 'consent_denied') {
    await ctx.editMessageText('Без согласия функционал недоступен.');
  }

  await ctx.answerCbQuery();
});

// =============================
// 9️⃣ Команда /profile
// =============================
bot.command('profile', async (ctx) => {
  const user = getUser(ctx.from.id);

  if (!user) {
    return ctx.reply('Профиль не найден. Отправьте /start для регистрации.');
  }

  const msg = `Ваш профиль:
ID: ${user.telegramId}
Имя: ${user.firstName}
Username: @${user.username}
Дата регистрации: ${new Date(user.joined).toLocaleDateString()}`;

  await ctx.reply(msg);
});

// =============================
// 🔟 Команда /menu
// =============================
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

// =============================
// 1️⃣1️⃣ Создать документ
// =============================
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

// =============================
// 1️⃣2️⃣ Категории
// =============================
bot.action(/category_.+/, async (ctx) => {
  const category = ctx.match[0].split('_')[1];
  await ctx.reply(`Вы выбрали категорию: ${category}. Функция в разработке.`);
  await ctx.answerCbQuery();
});

// =============================
// 1️⃣3️⃣ Запуск бота
// =============================
bot.launch()
  .then(() => console.log('🤖 Bot started successfully'))
  .catch((err) => console.error('Bot launch error:', err));

// =============================
// 1️⃣4️⃣ Корректное завершение
// =============================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
