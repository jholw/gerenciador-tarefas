/**
 * Reminders - Sistema de lembretes de tarefas e notificações
 * Gerencia lembretes com prazos, notificações e alarmes
 */

class ReminderManager {
  constructor() {
    this.checkInterval = null;
    this.reminderCallbacks = [];
    this.notificationPermission = false;
  }

  async init() {
    // Verifica permissão de notificação
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.notificationPermission = true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission === 'granted';
      }
    }
    
    // Inicia verificação periódica
    this._startChecking();
  }

  // ==================== Gerenciamento de Lembretes ====================

  async createReminder(data) {
    const reminder = {
      id: 'rem_' + Date.now().toString(),
      userId: data.userId,
      taskId: data.taskId || '',
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      remindBefore: data.remindBefore || 30, // minutos antes
      repeat: data.repeat || 'none', // none, daily, weekly, monthly, custom
      repeatInterval: data.repeatInterval || 0,
      active: true,
      notified: false,
      createdAt: new Date().toISOString(),
      lastNotified: null,
      priority: data.priority || 'medium',
      sound: data.sound || 'default'
    };
    
    await db.add(STORES.REMINDERS, reminder);
    
    // Agenda notificação se necessário
    this._scheduleReminder(reminder);
    
    return reminder;
  }

  async updateReminder(reminderId, updates) {
    const reminder = await db.get(STORES.REMINDERS, reminderId);
    if (!reminder) throw new Error('Lembrete não encontrado');
    
    Object.assign(reminder, updates);
    await db.put(STORES.REMINDERS, reminder);
    
    return reminder;
  }

  async deleteReminder(reminderId) {
    await db.delete(STORES.REMINDERS, reminderId);
  }

  async getUserReminders(userId) {
    const reminders = await db.getByIndex(STORES.REMINDERS, 'userId', userId);
    return reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async getTaskReminders(taskId) {
    return await db.getByIndex(STORES.REMINDERS, 'taskId', taskId);
  }

  async getActiveReminders(userId) {
    const reminders = await db.getByIndex(STORES.REMINDERS, 'userId', userId);
    return reminders.filter(r => r.active).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async getOverdueReminders(userId) {
    const now = new Date().toISOString();
    const reminders = await db.getByIndex(STORES.REMINDERS, 'userId', userId);
    return reminders.filter(r => r.active && r.dueDate < now).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async getUpcomingReminders(userId, days = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const reminders = await db.getByIndex(STORES.REMINDERS, 'userId', userId);
    return reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return r.active && dueDate >= now && dueDate <= future;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async toggleReminder(reminderId) {
    const reminder = await db.get(STORES.REMINDERS, reminderId);
    if (!reminder) throw new Error('Lembrete não encontrado');
    
    reminder.active = !reminder.active;
    await db.put(STORES.REMINDERS, reminder);
    
    return reminder;
  }

  // ==================== Notificações ====================

  async sendNotification(title, body, tag = '', data = {}) {
    // Notificação na interface
    this._showInAppNotification(title, body, data);
    
    // Notificação do sistema
    if (this.notificationPermission) {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag,
          data,
          requireInteraction: true
        });
        
        notification.onclick = () => {
          window.focus();
          if (data.taskId) {
            window.dispatchEvent(new CustomEvent('notification:click', { detail: data }));
          }
        };
        
        return notification;
      } catch (e) {
        console.warn('Erro ao enviar notificação:', e);
      }
    }
    
    // Toca som se configurado
    if (data.sound) {
      this._playNotificationSound(data.sound);
    }
  }

  _showInAppNotification(title, body, data = {}) {
    const event = new CustomEvent('reminder:show', {
      detail: { title, body, ...data }
    });
    window.dispatchEvent(event);
  }

  _playNotificationSound(sound = 'default') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (e) {
      // Silencia erro de áudio
    }
  }

  // ==================== Verificação Periódica ====================

  _startChecking() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    
    // Verifica a cada 30 segundos
    this.checkInterval = setInterval(() => this._checkReminders(), 30000);
    
    // Verificação inicial
    this._checkReminders();
  }

  async _checkReminders() {
    try {
      const now = new Date();
      const allReminders = await db.getAll(STORES.REMINDERS);
      
      for (const reminder of allReminders) {
        if (!reminder.active || reminder.notified) continue;
        
        const dueDate = new Date(reminder.dueDate);
        const remindTime = new Date(dueDate.getTime() - reminder.remindBefore * 60 * 1000);
        
        // Verifica se está na hora de notificar
        if (now >= remindTime && now < dueDate) {
          await this.sendNotification(
            `⏰ Lembrete: ${reminder.title}`,
            reminder.description || `Prazo: ${dueDate.toLocaleString('pt-BR')}`,
            reminder.id,
            { reminderId: reminder.id, taskId: reminder.taskId, sound: reminder.sound }
          );
          
          reminder.notified = true;
          reminder.lastNotified = now.toISOString();
          await db.put(STORES.REMINDERS, reminder);
          
          this._notifyCallbacks(reminder);
          
          // Se for repetir, agenda próximo
          if (reminder.repeat !== 'none') {
            await this._scheduleNextRepeat(reminder);
          }
        }
        
        // Verifica se passou do prazo e não foi notificado
        if (now > dueDate && !reminder.notified) {
          await this.sendNotification(
            `🚨 Atrasado: ${reminder.title}`,
            `Esta tarefa está atrasada desde ${dueDate.toLocaleString('pt-BR')}`,
            reminder.id,
            { reminderId: reminder.id, taskId: reminder.taskId, urgent: true, sound: reminder.sound }
          );
          
          reminder.notified = true;
          reminder.lastNotified = now.toISOString();
          await db.put(STORES.REMINDERS, reminder);
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar lembretes:', e);
    }
  }

  async _scheduleNextRepeat(reminder) {
    const intervals = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      custom: reminder.repeatInterval || 1
    };
    
    const days = intervals[reminder.repeat] || 1;
    const nextDue = new Date(reminder.dueDate);
    nextDue.setDate(nextDue.getDate() + days);
    
    const newReminder = {
      ...reminder,
      id: 'rem_' + Date.now().toString(),
      dueDate: nextDue.toISOString(),
      notified: false,
      lastNotified: null,
      createdAt: new Date().toISOString()
    };
    
    delete newReminder._id;
    await db.add(STORES.REMINDERS, newReminder);
  }

  _scheduleReminder(reminder) {
    // O sistema de polling cuida disso
  }

  onReminder(callback) {
    this.reminderCallbacks.push(callback);
    return () => {
      this.reminderCallbacks = this.reminderCallbacks.filter(cb => cb !== callback);
    };
  }

  _notifyCallbacks(reminder) {
    for (const callback of this.reminderCallbacks) {
      try {
        callback(reminder);
      } catch (e) {
        console.error('Erro no callback de lembrete:', e);
      }
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // ==================== Utilitários ====================

  formatDueDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return `Atrasado ${Math.abs(Math.round(diff / (1000 * 60 * 60 * 24)))} dias`;
    if (diff < 86400000) return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800000) return `Amanhã às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPriorityColor(priority) {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#22c55e',
      trivial: '#6b7280'
    };
    return colors[priority] || colors.medium;
  }
}

// Singleton
const reminderManager = new ReminderManager();
window.reminderManager = reminderManager;