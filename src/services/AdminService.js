import db from '../database/db.js';
import logger from '../utils/logger.js';

export class AdminService {
  static async addAdmin(userId, addedById) {
    try {
      await db.admins.add(userId);
      logger.userEvent(addedById, 'add_admin', { targetUserId: userId });
      return true;
    } catch (error) {
      logger.error(`Ошибка добавления админа ${userId}: ${error.message}`);
      return false;
    }
  }

  static async removeAdmin(userId, removedById) {
    try {
      await db.admins.remove(userId);
      logger.userEvent(removedById, 'remove_admin', { targetUserId: userId });
      return true;
    } catch (error) {
      logger.error(`Ошибка удаления админа ${userId}: ${error.message}`);
      return false;
    }
  }

  static async getStats() {
    const users = await db.users.getAll();
    const admins = await db.admins.getAll();
    
    const registered = users.filter(u => u.agreementAccepted).length;
    const withPhone = users.filter(u => u.phoneNumber).length;
    
    return {
      totalUsers: users.length,
      registeredUsers: registered,
      usersWithPhone: withPhone,
      admins: admins.length,
      last24h: users.filter(u => {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return new Date(u.createdAt).getTime() > dayAgo;
      }).length
    };
  }
}