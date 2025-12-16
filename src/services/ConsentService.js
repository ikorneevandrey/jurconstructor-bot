// src/services/ConsentService.js
const fs = require('fs');
const path = require('path');

class ConsentService {
  constructor(dbPath = path.join(__dirname, '../../data/database.json')) {
    this.dbPath = dbPath;
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({ users: {} }, null, 2));
    }
  }

  _load() {
    return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
  }

  _save(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  getUser(userId) {
    const data = this._load();
    return data.users[userId] || null;
  }

  saveConsent(userId, accepted) {
    const data = this._load();
    const now = new Date().toISOString();
    data.users[userId] = {
      ...data.users[userId],
      privacyConsentAccepted: accepted,
      privacyConsentDate: accepted ? now : null,
      consentRefused: !accepted,
      updatedAt: now,
      createdAt: data.users[userId]?.createdAt || now
    };
    this._save(data);
    return data.users[userId];
  }

  hasConsent(userId) {
    const user = this.getUser(userId);
    return user?.privacyConsentAccepted === true;
  }

  getAllUsers() {
    return Object.values(this._load().users);
  }

  exportCSV(filepath) {
    const users = this.getAllUsers();
    const rows = [
      ['ID', 'Username', 'Accepted', 'Refused', 'Date'].join(';'),
      ...users.map(u => [
        u.id,
        u.username || '',
        u.privacyConsentAccepted ? 'YES' : 'NO',
        u.consentRefused ? 'YES' : 'NO',
        u.privacyConsentDate || ''
      ].join(';'))
    ];
    fs.writeFileSync(filepath, rows.join('\n'));
    return filepath;
  }
}

module.exports = new ConsentService();
