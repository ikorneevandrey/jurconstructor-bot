// sync.js — синхронизация JSON с сервера в локальную PostgreSQL
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('PG_DATABASE:', process.env.PG_DATABASE);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_PORT:', process.env.PG_PORT);
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Client } = require('pg');

// =============================
// 1️⃣ Настройки
// =============================
const SERVER_URL = process.env.SERVER_DATA_URL || 'https://smart-jurist-tier44.amvera.io/data';
const LOCAL_DATA_DIR = path.join(__dirname, 'data'); // локальная папка для json

const PG_CONFIG = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT || 5432)
};

// =============================
// 2️⃣ Утилита: скачивание JSON
// =============================
async function downloadJSON(filename) {
  const url = `${SERVER_URL}/${filename}`;
  const localPath = path.join(LOCAL_DATA_DIR, filename);

  try {
    const { data } = await axios.get(url, { timeout: 10000 }); // таймаут 10 секунд
    fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Файл ${filename} скачан и сохранен локально`);
    return data;
  } catch (err) {
    console.error(`❌ Ошибка скачивания ${filename}:`, err.message);
    // если не удалось скачать, пытаемся использовать локальный файл
    if (fs.existsSync(localPath)) {
      console.log(`⚠️ Используется локальная копия ${filename}`);
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }
    return null;
  }
}

// =============================
// 3️⃣ Синхронизация пользователей
// =============================
async function syncUsersToPostgres(client, users) {
  if (!users) {
    console.log("⚠️ Нет данных пользователей для синхронизации");
    return;
  }

  for (const key of Object.keys(users)) {
    const user = users[key];

    const query = `
      INSERT INTO users (telegram_id, first_name, username, consent_given, consent_date, joined)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (telegram_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        username = EXCLUDED.username,
        consent_given = EXCLUDED.consent_given,
        consent_date = EXCLUDED.consent_date,
        joined = EXCLUDED.joined
    `;

    const values = [
      user.telegramId,
      user.firstName || '',
      user.username || '',
      user.consentGiven || false,
      user.consentDate || null,
      user.joined || new Date().toISOString()
    ];

    try {
      await client.query(query, values);
    } catch (err) {
      console.error(`❌ Ошибка записи пользователя ${user.telegramId}:`, err.message);
    }
  }

  console.log("✅ PostgreSQL: пользователи обновлены");
}

// =============================
// 4️⃣ Основной процесс
// =============================
async function main() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }

  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log("🟢 PostgreSQL подключена");
  } catch (err) {
    console.error("❌ Ошибка подключения PostgreSQL:", err.message);
    return;
  }

  const users = await downloadJSON("users.json");
  const database = await downloadJSON("database.json"); // пока просто скачиваем

  await syncUsersToPostgres(client, users);

  await client.end();
  console.log("🎯 Синхронизация завершена");
}

// =============================
// 5️⃣ Запуск
// =============================
main().catch(err => console.error("Fatal error:", err));
