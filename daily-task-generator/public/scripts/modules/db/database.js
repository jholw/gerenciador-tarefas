/**
 * Database - Camada de persistência IndexedDB
 * Gerencia usuários, tarefas, projetos, sprints, mensagens e configurações
 */

const DB_NAME = 'DailyTaskGeneratorDB';
const DB_VERSION = 2;

const STORES = {
  USERS: 'users',
  TASKS: 'tasks',
  PROJECTS: 'projects',
  SPRINTS: 'sprints',
  BACKLOG: 'backlog',
  STANDUPS: 'standups',
  RETROSPECTIVES: 'retrospectives',
  MESSAGES: 'messages',
  REMINDERS: 'reminders',
  COLUMNS: 'columns',
  SETTINGS: 'settings'
};

class Database {
  constructor() {
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Users store
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('googleId', 'googleId', { unique: true });
        }

        // Tasks store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          taskStore.createIndex('projectId', 'projectId', { unique: false });
          taskStore.createIndex('assignedTo', 'assignedTo', { unique: false });
          taskStore.createIndex('sprintId', 'sprintId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('priority', 'priority', { unique: false });
          taskStore.createIndex('dueDate', 'dueDate', { unique: false });
          taskStore.createIndex('createdBy', 'createdBy', { unique: false });
        }

        // Projects store
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
          projectStore.createIndex('ownerId', 'ownerId', { unique: false });
          projectStore.createIndex('memberIds', 'memberIds', { unique: false, multiEntry: true });
        }

        // Sprints store
        if (!db.objectStoreNames.contains(STORES.SPRINTS)) {
          const sprintStore = db.createObjectStore(STORES.SPRINTS, { keyPath: 'id' });
          sprintStore.createIndex('projectId', 'projectId', { unique: false });
          sprintStore.createIndex('status', 'status', { unique: false });
        }

        // Backlog store
        if (!db.objectStoreNames.contains(STORES.BACKLOG)) {
          const backlogStore = db.createObjectStore(STORES.BACKLOG, { keyPath: 'id' });
          backlogStore.createIndex('projectId', 'projectId', { unique: false });
          backlogStore.createIndex('sprintId', 'sprintId', { unique: false });
        }

        // Standups store
        if (!db.objectStoreNames.contains(STORES.STANDUPS)) {
          const standupStore = db.createObjectStore(STORES.STANDUPS, { keyPath: 'id' });
          standupStore.createIndex('projectId', 'projectId', { unique: false });
          standupStore.createIndex('userId', 'userId', { unique: false });
          standupStore.createIndex('date', 'date', { unique: false });
        }

        // Retrospectives store
        if (!db.objectStoreNames.contains(STORES.RETROSPECTIVES)) {
          const retroStore = db.createObjectStore(STORES.RETROSPECTIVES, { keyPath: 'id' });
          retroStore.createIndex('projectId', 'projectId', { unique: false });
          retroStore.createIndex('sprintId', 'sprintId', { unique: false });
        }

        // Messages store (chat)
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
          msgStore.createIndex('projectId', 'projectId', { unique: false });
          msgStore.createIndex('senderId', 'senderId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
          msgStore.createIndex('taskId', 'taskId', { unique: false });
        }

        // Reminders store
        if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
          const remStore = db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
          remStore.createIndex('userId', 'userId', { unique: false });
          remStore.createIndex('taskId', 'taskId', { unique: false });
          remStore.createIndex('dueDate', 'dueDate', { unique: false });
          remStore.createIndex('active', 'active', { unique: false });
        }

        // Columns store (kanban customization)
        if (!db.objectStoreNames.contains(STORES.COLUMNS)) {
          const colStore = db.createObjectStore(STORES.COLUMNS, { keyPath: 'id' });
          colStore.createIndex('projectId', 'projectId', { unique: false });
          colStore.createIndex('order', 'order', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async add(storeName, data) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton
const db = new Database();
window.db = db;
window.STORES = STORES;