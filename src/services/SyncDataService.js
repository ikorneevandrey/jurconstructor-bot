const fs = require('fs');
const path = require('path');

class SyncDataService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/users.json');
    this.init();
  }

  init() {
    try {
      // Создаем папку data если нет
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Создаем файл если нет
      if (!fs.existsSync(this.dbPath)) {
        const initialData = { 
          users: {}, 
          orders: {}, 
          cases: {},
          templates: {
            contracts: [
              { id: 1, name: 'Договор аренды', category: 'rent' },
              { id: 2, name: 'Договор купли-продажи', category: 'sale' },
              { id: 3, name: 'Трудовой договор', category: 'employment' }
            ],
            claims: [
              { id: 4, name: 'Исковое заявление', category: 'lawsuit' },
              { id: 5, name: 'Жалоба', category: 'complaint' },
              { id: 6, name: 'Претензия', category: 'claim' }
            ]
          }
        };
        this.saveData(initialData);
      }
      
      console.log('✅ База данных инициализирована');
    } catch (error) {
      console.error('❌ Ошибка инициализации БД:', error);
    }
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      return { users: {}, orders: {}, cases: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения данных:', error);
      return false;
    }
  }

  // === Работа с пользователями ===
  getUser(userId) {
    const data = this.loadData();
    return data.users[userId] || null;
  }

  saveUser(userId, userData) {
    const data = this.loadData();
    const now = new Date().toISOString();
    
    data.users[userId] = {
      ...(data.users[userId] || {}),
      ...userData,
      id: userId,
      updatedAt: now,
      createdAt: data.users[userId]?.createdAt || now
    };
    
    this.saveData(data);
    return data.users[userId];
  }

  updateUser(userId, updates) {
    const data = this.loadData();
    if (!data.users[userId]) return null;
    
    data.users[userId] = {
      ...data.users[userId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveData(data);
    return data.users[userId];
  }

  getAllUsers() {
    const data = this.loadData();
    return data.users;
  }

  deleteUser(userId) {
    const data = this.loadData();
    delete data.users[userId];
    this.saveData(data);
    return true;
  }

  // === Работа с заказами ===
  createOrder(orderData) {
    const data = this.loadData();
    const orderId = `order_${Date.now()}`;
    const now = new Date().toISOString();
    
    data.orders[orderId] = {
      ...orderData,
      id: orderId,
      createdAt: now,
      updatedAt: now,
      status: 'pending'
    };
    
    this.saveData(data);
    return data.orders[orderId];
  }

  getOrder(orderId) {
    const data = this.loadData();
    return data.orders[orderId] || null;
  }

  getUserOrders(userId) {
    const data = this.loadData();
    return Object.values(data.orders).filter(order => order.userId === userId);
  }

  updateOrder(orderId, updates) {
    const data = this.loadData();
    if (!data.orders[orderId]) return null;
    
    data.orders[orderId] = {
      ...data.orders[orderId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveData(data);
    return data.orders[orderId];
  }

  // === Работа с делами ===
  createCase(caseData) {
    const data = this.loadData();
    const caseId = `case_${Date.now()}`;
    const now = new Date().toISOString();
    
    data.cases[caseId] = {
      ...caseData,
      id: caseId,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };
    
    this.saveData(data);
    return data.cases[caseId];
  }

  getCase(caseId) {
    const data = this.loadData();
    return data.cases[caseId] || null;
  }

  getUserCases(userId) {
    const data = this.loadData();
    return Object.values(data.cases).filter(c => c.userId === userId);
  }

  updateCase(caseId, updates) {
    const data = this.loadData();
    if (!data.cases[caseId]) return null;
    
    data.cases[caseId] = {
      ...data.cases[caseId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveData(data);
    return data.cases[caseId];
  }

  // === Шаблоны документов ===
  getAllTemplates() {
    const data = this.loadData();
    return data.templates || {};
  }

  getTemplateById(templateId) {
    const templates = this.getAllTemplates();
    
    // Ищем во всех категориях
    for (const category in templates) {
      const found = templates[category].find(t => t.id == templateId);
      if (found) return found;
    }
    
    return null;
  }

  // === Поиск и фильтрация ===
  searchUsers(query) {
    const data = this.loadData();
    const users = Object.values(data.users);
    
    return users.filter(user => 
      user.username?.toLowerCase().includes(query.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // === Статистика ===
  getStats() {
    const data = this.loadData();
    
    return {
      totalUsers: Object.keys(data.users).length,
      activeUsers: Object.values(data.users).filter(u => u.isActive).length,
      totalOrders: Object.keys(data.orders).length,
      totalCases: Object.keys(data.cases).length,
      lastUpdated: new Date().toISOString()
    };
  }

  // === Резервное копирование ===
  createBackup() {
    try {
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, `backup_${Date.now()}.json`);
      const data = this.loadData();
      
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      console.log(`✅ Резервная копия создана: ${backupPath}`);
      
      // Удаляем старые бэкапы (оставляем последние 10)
      this.cleanupOldBackups(backupDir);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Ошибка создания бэкапа:', error);
      return null;
    }
  }

  cleanupOldBackups(backupDir) {
    try {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => ({ name: f, path: path.join(backupDir, f) }))
        .map(f => ({ ...f, time: fs.statSync(f.path).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      // Удаляем все кроме последних 10
      if (files.length > 10) {
        files.slice(10).forEach(f => {
          fs.unlinkSync(f.path);
          console.log(`🗑️ Удален старый бэкап: ${f.name}`);
        });
      }
    } catch (error) {
      console.error('Ошибка очистки бэкапов:', error);
    }
  }
}

// Экспортируем синглтон
module.exports = new SyncDataService();