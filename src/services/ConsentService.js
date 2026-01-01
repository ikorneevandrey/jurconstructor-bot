import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ConsentService {
  constructor(dbPath = path.join(__dirname, '../../data/database.json')) {
    this.dbPath = dbPath;
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({ users: {} }, null, 2));
    }
  }

  async _load() {
    const content = await fs.promises.readFile(this.dbPath, 'utf8');
    return JSON.parse(content);
  }

  async _save(data) {
    await fs.promises.writeFile(this.dbPath, JSON.stringify(data, null, 2));
  }

  async getUser(userId) {
    const data = await this._load();
    return data.users[userId] || null;
  }

  async saveUser(userId, userData = {}) {
    const data = await this._load();
    const now = new Date().toISOString();
    data.users[userId] = {
      ...data.users[userId],
      ...userData,
      id: userId,
      updatedAt: now,
      createdAt: data.users[userId]?.createdAt || now
    };
    await this._save(data);
    return data.users[userId];
  }

  async saveConsent(userId, accepted = true) {
    return this.saveUser(userId, {
      privacyConsentAccepted: accepted,
      privacyConsentDate: accepted ? new Date().toISOString() : null,
      consentRefused: !accepted
    });
  }

  async revokeConsent(userId) {
    return this.saveUser(userId, {
      privacyConsentAccepted: false,
      privacyConsentDate: null,
      consentRefused: true
    });
  }

  async hasConsent(userId) {
    const user = await this.getUser(userId);
    return user?.privacyConsentAccepted === true;
  }

  async getAllUsers() {
    const data = await this._load();
    return Object.values(data.users);
  }

  async exportCSV(filepath) {
    const users = await this.getAllUsers();
    const rows = [
      ['ID', 'Username', 'Accepted', 'Refused', 'ConsentDate'].join(';'),
      ...users.map(u => [
        u.id,
        u.username || '',
        u.privacyConsentAccepted ? 'YES' : 'NO',
        u.consentRefused ? 'YES' : 'NO',
        u.privacyConsentDate || ''
      ].join(';'))
    ];
    await fs.promises.writeFile(filepath, rows.join('\n'));
    return filepath;
  }

  async exportJSON(filepath) {
    const users = await this.getAllUsers();
    const data = {};
    users.forEach(u => data[u.id] = u);
    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
    return filepath;
  }
}

export default new ConsentService();
