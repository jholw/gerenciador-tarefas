/**
 * Chat - Sistema de bate-papo para intercomunicação entre membros do projeto
 * Suporta mensagens em tempo real, menções a usuários e tarefas
 */

class ChatManager {
  constructor() {
    this.currentProjectId = null;
    this.currentUserId = null;
    this.currentUserName = '';
    this.messageListeners = [];
    this.pollInterval = null;
  }

  async init(projectId, userId, userName) {
    this.currentProjectId = projectId;
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    // Inicia polling para novas mensagens
    this._startPolling();
  }

  async sendMessage(text, taskId = '') {
    if (!text.trim()) return null;
    
    const message = {
      projectId: this.currentProjectId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      text: text.trim(),
      taskId,
      timestamp: new Date().toISOString(),
      type: 'text' // text, system, task_update
    };
    
    const id = await db.add(STORES.MESSAGES, message);
    message.id = id;
    
    // Notifica listeners
    this._notifyListeners(message);
    
    return message;
  }

  async sendSystemMessage(projectId, text) {
    const message = {
      projectId,
      senderId: 'system',
      senderName: 'Sistema',
      text,
      taskId: '',
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    const id = await db.add(STORES.MESSAGES, message);
    message.id = id;
    
    this._notifyListeners(message);
    return message;
  }

  async getMessages(limit = 50, before = null) {
    const allMessages = await db.getByIndex(STORES.MESSAGES, 'projectId', this.currentProjectId);
    
    let filtered = allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (before) {
      filtered = filtered.filter(m => new Date(m.timestamp) < new Date(before));
    }
    
    return filtered.slice(0, limit).reverse();
  }

  async getTaskMessages(taskId) {
    const allMessages = await db.getByIndex(STORES.MESSAGES, 'taskId', taskId);
    return allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async getRecentMessages(projectId, minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const allMessages = await db.getByIndex(STORES.MESSAGES, 'projectId', projectId);
    
    return allMessages
      .filter(m => m.timestamp >= cutoff)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  onMessage(callback) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  _notifyListeners(message) {
    for (const listener of this.messageListeners) {
      try {
        listener(message);
      } catch (e) {
        console.error('Erro no listener de mensagem:', e);
      }
    }
  }

  _startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    let lastTimestamp = new Date().toISOString();
    
    this.pollInterval = setInterval(async () => {
      if (!this.currentProjectId) return;
      
      try {
        const allMessages = await db.getByIndex(STORES.MESSAGES, 'projectId', this.currentProjectId);
        const newMessages = allMessages.filter(m => m.timestamp > lastTimestamp && m.senderId !== this.currentUserId);
        
        if (newMessages.length > 0) {
          lastTimestamp = new Date().toISOString();
          for (const msg of newMessages) {
            this._notifyListeners(msg);
          }
        }
      } catch (e) {
        // Silencia erros de polling
      }
    }, 2000); // Poll a cada 2 segundos
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  renderMessage(message) {
    const div = document.createElement('div');
    div.className = `chat-message ${message.senderId === this.currentUserId ? 'own' : ''} ${message.type === 'system' ? 'system' : ''}`;
    div.dataset.messageId = message.id;
    
    if (message.type === 'system') {
      div.innerHTML = `
        <div class="chat-system-msg">
          <span class="chat-system-icon">ℹ️</span>
          <span>${this._escapeHtml(message.text)}</span>
        </div>
      `;
    } else {
      const isOwn = message.senderId === this.currentUserId;
      div.innerHTML = `
        <div class="chat-avatar">
          ${message.senderName.charAt(0).toUpperCase()}
        </div>
        <div class="chat-content">
          <div class="chat-header">
            <strong class="chat-sender">${this._escapeHtml(message.senderName)}</strong>
            <span class="chat-time">${this.formatTimestamp(message.timestamp)}</span>
          </div>
          <p class="chat-text">${this._formatMessageText(message.text)}</p>
          ${message.taskId ? `<a href="#" class="chat-task-link" data-task-id="${message.taskId}">🔗 Ver tarefa</a>` : ''}
        </div>
      `;
    }
    
    return div;
  }

  _formatMessageText(text) {
    // Converte menções a usuários (@nome)
    let formatted = this._escapeHtml(text);
    
    // Converte menções a tarefas (#task_id)
    formatted = formatted.replace(/#(\w+)/g, '<span class="chat-mention-task">#$1</span>');
    
    // Converte URLs em links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    
    // Converte quebras de linha
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton
const chatManager = new ChatManager();
window.chatManager = chatManager;