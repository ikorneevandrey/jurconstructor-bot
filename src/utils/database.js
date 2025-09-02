const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.json');

// Создаем папку data если её нет
async function init() {
  try {
    await fs.access(path.dirname(dbPath));
  } catch {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify({ users: {}, orders: {} }));
  }
}

// Сохраняем данные
async function saveData(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Загружаем данные
async function loadData() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { users: {}, orders: {} };
  }
}

// Сохраняем пользователя
async function saveUser(telegramId, userData) {
  const data = await loadData();
  data.users[telegramId] = { ...userData, telegramId };
  await saveData(data);
}

// Получаем пользователя
async function getUser(telegramId) {
  const data = await loadData();
  return data.users[telegramId] || null;
}

module.exports = { init, saveUser, getUser };