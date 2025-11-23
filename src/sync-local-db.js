// sync-local-db.js — синхронизация JSON с сервера в локальную PostgreSQL

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const axios = require('axios');

// =============================
// 1️⃣ Настройки
// =============================
const SERVER_URL = process.env.SERVER_DATA_URL; 
const LOCAL_PATH = path.resolve(__dirname, './data'); 

const PG_CONFIG = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432
};

// =============================
// 2️⃣ Загрузка JSON с сервера
// =============================
async function downloadJSON(fileName) {
  const url = `${SERVER_URL}/${fileName}`;
  const localFile = path.join(LOCAL_PATH, fileName);

  try {
    const { data } = await axios.get(url);
    fs.writeFileSync(localFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${fileName} скачан`);
    return data;
  } catch (err) {
    console.error(`❌ Ошибка загрузки ${fileName}:`, err.message);
    return null;
  }
}

// =============================
// 3️⃣ Синхронизация пользователей
// =============================
async function syncUsers(client, users) {
  if (!users) return;

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
      user.firstName,
      user.username,
      user.consentGiven,
      user.consentDate,
      user.joined
    ];

    try {
      await client.query(query, values);
    } catch (err) {
      console.error(`Ошибка пользователя ${user.telegramId}:`, err.message);
    }
  }

  console.log('✅ Пользователи синхронизированы');
}

// =============================
// 4️⃣ Основная функция
// =============================
async function main() {
  if (!fs.existsSync(LOCAL_PATH)) fs.mkdirSync(LOCAL_PATH, { recursive: true });

  const client = new Client(PG_CONFIG);
  await client.connect();

  const users = await downloadJSON('users.json');
  const database = await downloadJSON('database.json'); // пока не используем

  await syncUsers(client, users);

  await client.end();
  console.log('🎯 Синхронизация завершена');
}

// =============================
// 5️⃣ Запуск
// =============================
main().catch(err => console.error('Fatal error:', err));
