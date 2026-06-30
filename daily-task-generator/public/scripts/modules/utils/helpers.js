/**
 * helpers.js - Utilitários e constantes compartilhadas
 * Centraliza helpers, constantes e funções reutilizáveis
 */

// ==================== CONSTANTES ====================

const PRIORITY_LABELS = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
  trivial: 'Trivial'
};

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
  trivial: '#6b7280'
};

const TYPE_LABELS = {
  task: 'Tarefa',
  bug: 'Bug',
  feature: 'Funcionalidade',
  improvement: 'Melhoria',
  epic: 'Épico'
};

const STATUS_LABELS = {
  planning: '📋 Planejamento',
  active: '🏃 Ativa',
  completed: '✅ Concluída',
  pending: 'Pendente',
  'in-progress': 'Em Andamento',
  done: 'Concluído'
};

const NOTIFICATION_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  reminder: '⏰',
  urgent: '🚨',
  info: 'ℹ️'
};

const MEMBER_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];

const TASK_TYPE_OPTIONS = [
  { value: 'task', label: 'Tarefa' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Funcionalidade' },
  { value: 'improvement', label: 'Melhoria' },
  { value: 'epic', label: 'Épico' }
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Crítica' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
  { value: 'trivial', label: 'Trivial' }
];

// ==================== HELPERS ====================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function generateId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nowISO() {
  return new Date().toISOString();
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ==================== EXPORTS ====================
// Disponibiliza para uso global (arquivos carregados via script tag)
window.PRIORITY_LABELS = PRIORITY_LABELS;
window.PRIORITY_COLORS = PRIORITY_COLORS;
window.TYPE_LABELS = TYPE_LABELS;
window.STATUS_LABELS = STATUS_LABELS;
window.NOTIFICATION_ICONS = NOTIFICATION_ICONS;
window.MEMBER_COLORS = MEMBER_COLORS;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.generateId = generateId;
window.todayStr = todayStr;
window.nowISO = nowISO;
window.debounce = debounce;