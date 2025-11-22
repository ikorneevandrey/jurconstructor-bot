// ==========================================
// index.js — Бот с JSON базой на сервере
// ==========================================

// 1️⃣ Загрузка .env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Проверка BOT_TOKEN
console.log('=== BOT STARTUP DEBUG ===');
console.log('Node:', process.version);
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'OK' : 'MISSING');

if (!process.env.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is required!');
  process.exit(1);
}

// 2️⃣ Импорты
const { Telegraf } = require('telegraf');
const fs = require('fs');

// Пути к JSON файлам
const USERS_FILE = path.resolve(__dirname, './data/users.json');
const DATABASE_FILE = path.resolve(__dirname, './data/database.json');

// 3️⃣ Файловая диагностика
try {
  console.log('Root files:', fs.readdirSync('.'));
  console.log('Src files:', fs.readdirSync('./src'));
} catch (err) {
  console.error('FS error:', err.message);
}

// =============================
// 4️⃣ Функции работы с JSON
// =============================
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Пользователи
function saveUser(userId, userData) {
  const users = readJSON(USERS_FILE);
  users[userId] = userData;
  writeJSON(USERS_FILE, users);
}

function getUser(userId) {
  const users = readJSON(USERS_FILE);
  return users[userId] || null;
}

// Документы
function saveDocument(docId, docData) {
  const db = readJSON(DATABASE_FILE);
  db[docId] = docData;
  writeJSON(DATABASE_FILE, db);
}

// =============================
// 5️⃣ Создание бота
// =============================
const bot = new Telegraf(process.env.BOT_TOKEN);

// =============================
// 6️⃣ /start — приветствие
// =============================
bot.start(async (ctx) => {
  const consentMessage = `Добро пожаловать в Smart_JuristBot! 🧑‍💼

Для работы бота необходимо согласие на обработку минимальных данных:
• Telegram ID  
• Имя  
• Username  

Политика конфиденциальности: https://disk.yandex.ru/i/iN8LYPvxzELuOg`;

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
// 7️⃣ Callback кнопки
// =============================
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
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

      await ctx.editMessageText(
        'Спасибо! Согласие принято. Теперь используйте команду /menu.'
      );

    } else if (data === 'consent_denied') {
      await ctx.editMessageText('Без согласия функционал недоступен.');
    }

    await ctx.answerCbQuery();

  } catch (err) {
    console.error('Callback error:', err);
  }
});

// =============================
// 8️⃣ /profile — Профиль пользователя
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
// 9️⃣ /menu — Главное меню
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
// 🔟 Кнопка “Создать документ”
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
// 1️⃣1️⃣ Реакция на категории
// =============================
bot.action(/category_.+/, async (ctx) => {
  const category = ctx.match[0].split('_')[1];
  await ctx.reply(`Вы выбрали категорию: ${category}. Функция в разработке.`);
  await ctx.answerCbQuery();
});

// =============================
// 1️⃣2️⃣ Запуск
// =============================
bot.launch()
  .then(() => console.log('=== BOT STARTED SUCCESSFULLY ==='))
  .catch((err) => {
    console.error('BOT STARTUP ERROR:', err);
    process.exit(1);
  });

// =============================
// 1️⃣3️⃣ Корректное завершение
// =============================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
