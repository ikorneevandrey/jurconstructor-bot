import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AsyncQueue } from '../../utils/async-queue.js';
import logger from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class JsonDatabase {
  constructor(basePath) {
    this.basePath = basePath || path.join(__dirname, '../../../data');
    this.usersPath = path.join(this.basePath, 'users');
    this.writeQueue = new AsyncQueue();
    this.cache = new Map();
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.usersPath, { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'logs'), { recursive: true });
    } catch (error) {
      logger.error(`Ошибка создания директорий: ${error.message}`);
    }
  }

  getUserFilePath(userId) {
    return path.join(this.usersPath, `${userId}.json`);
  }

  async getUser(userId) {
    // Проверка кэша
    if (this.cache.has(userId)) {
      return this.cache.get(userId);
    }

    const filePath = this.getUserFilePath(userId);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const user = JSON.parse(data);
      
      // Кэшируем на 30 секунд
      this.cache.set(userId, user);
      setTimeout(() => this.cache.delete(userId), 30000);
      
      return user;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      logger.error(`Ошибка чтения пользователя ${userId}: ${error.message}`);
      throw error;
    }
  }

  async saveUser(user) {
    const filePath = this.getUserFilePath(user.id);
    const userData = JSON.stringify(user, null, 2);
    
    return this.writeQueue.enqueue(async () => {
      try {
        await fs.writeFile(filePath, userData, 'utf8');
        this.cache.set(user.id, user);
        return true;
      } catch (error) {
        logger.error(`Ошибка сохранения пользователя ${user.id}: ${error.message}`);
        
        // Повторная попытка через 1 секунду
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await fs.writeFile(filePath, userData, 'utf8');
          return true;
        } catch (retryError) {
          logger.error(`Повторная ошибка сохранения пользователя ${user.id}: ${retryError.message}`);
          throw retryError;
        }
      }
    });
  }

  async getAllUsers() {
    try {
      const files = await fs.readdir(this.usersPath);
      const users = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const userId = file.replace('.json', '');
          const user = await this.getUser(userId);
          if (user) users.push(user);
        }
      }
      
      return users;
    } catch (error) {
      logger.error(`Ошибка получения всех пользователей: ${error.message}`);
      return [];
    }
  }

  async deleteUser(userId) {
    const filePath = this.getUserFilePath(userId);
    
    return this.writeQueue.enqueue(async () => {
      try {
        await fs.unlink(filePath);
        this.cache.delete(userId);
        return true;
      } catch (error) {
        logger.error(`Ошибка удаления пользователя ${userId}: ${error.message}`);
        return false;
      }
    });
  }
}

// Отдельный класс для админов
class AdminStore {
  constructor(basePath) {
    this.basePath = basePath || path.join(__dirname, '../../../data');
    this.adminsPath = path.join(this.basePath, 'admins.json');
  }

  async getAll() {
    try {
      const data = await fs.readFile(this.adminsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Если файла нет, создаем с администратором из .env
      const defaultAdmin = process.env.ADMIN_ID ? [parseInt(process.env.ADMIN_ID)] : [];
      await this.saveAll(defaultAdmin);
      return defaultAdmin;
    }
  }

  async saveAll(admins) {
    await fs.writeFile(this.adminsPath, JSON.stringify(admins, null, 2), 'utf8');
  }

  async addAdmin(userId) {
    const admins = await this.getAll();
    if (!admins.includes(userId)) {
      admins.push(userId);
      await this.saveAll(admins);
    }
  }

  async removeAdmin(userId) {
    const admins = await this.getAll();
    const filtered = admins.filter(id => id !== userId);
    await this.saveAll(filtered);
  }
}