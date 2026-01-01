import JsonDatabase from './json/JsonDatabase.js';
import AdminStore from './json/AdminStore.js';

// В будущем можно заменить на:
// import SQLDatabase from './sql/SQLDatabase.js';

class Database {
  constructor() {
    // Сейчас используем JSON
    this.users = new JsonDatabase();
    this.admins = new AdminStore();
    
    // В будущем:
    // if (process.env.DB_TYPE === 'sqlite') {
    //   this.users = new SQLDatabase();
    // } else {
    //   this.users = new JsonDatabase();
    // }
  }
  
  async init() {
    await this.users.init();
    // await this.users.migrate(); // Для SQL
  }
  
  async getStats() {
    const users = await this.users.getAllUsers();
    const admins = await this.admins.getAll();
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.agreementAccepted).length,
      adminsCount: admins.length,
      databaseType: 'json'
    };
  }
}

export default new Database();