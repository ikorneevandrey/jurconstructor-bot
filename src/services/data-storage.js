const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/users.json');

// Чтение базы
function loadDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('DB read error:', err);
    return { users: {} };
  }
}

// Запись базы
function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (err) {
    console.error('DB write error:', err);
    return false;
  }
}

// Сохранение пользователя
function saveUser(userId, data) {
  const db = loadDB();
  db.users[userId] = data;
  return saveDB(db);
}

// Получение пользователя
function getUser(userId) {
  const db = loadDB();
  return db.users[userId] || null;
}

module.exports = {
  saveUser,
  getUser
};
