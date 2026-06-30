/**
 * taskGenerator.js - Gera tarefas de exemplo para testes/demonstração
 * Adaptado para funcionar no browser (ES modules style)
 */

const URGENCY_LEVELS = ['low', 'medium', 'high'];
const IMPORTANCE_LEVELS = ['low', 'medium', 'high'];
const PRIORITIES = ['low', 'medium', 'high', 'critical', 'trivial'];
const TYPES = ['task', 'bug', 'feature', 'improvement', 'epic'];
const SAMPLE_TITLES = [
  'Implementar autenticação JWT',
  'Criar tela de login responsiva',
  'Desenvolver API de usuários',
  'Configurar banco de dados',
  'Escrever testes unitários',
  'Corrigir bug no cálculo de horas',
  'Adicionar validação de formulários',
  'Otimizar consultas SQL',
  'Refatorar componente de busca',
  'Documentar endpoints da API',
  'Criar script de migração',
  'Implementar cache de resultados',
  'Configurar CI/CD pipeline',
  'Desenvolver notificações push',
  'Melhorar performance do frontend'
];

function generateSampleTasks(count = 5, projectId = '', columnId = '') {
  const tasks = [];

  for (let i = 0; i < count; i++) {
    const title = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
    const suffix = i >= SAMPLE_TITLES.length ? ` (${Math.floor(i / SAMPLE_TITLES.length) + 1})` : '';
    
    tasks.push({
      id: 'gen_' + Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
      title: title + suffix,
      description: `Tarefa de exemplo gerada automaticamente para fins de demonstração. Prioridade: ${PRIORITIES[i % PRIORITIES.length]}.`,
      projectId: projectId,
      assignedTo: '',
      createdBy: '',
      sprintId: '',
      columnId: columnId,
      status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'in-progress' : 'pending',
      priority: PRIORITIES[i % PRIORITIES.length],
      storyPoints: [1, 2, 3, 5, 8, 13][i % 6],
      type: TYPES[i % TYPES.length],
      labels: [],
      dueDate: '',
      estimatedHours: Math.round(Math.random() * 16) + 1,
      spentHours: 0,
      attachments: [],
      comments: [],
      subtasks: [],
      blockers: '',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: i % 3 === 0 ? new Date().toISOString() : ''
    });
  }

  return tasks;
}

function generateSampleBacklogItems(count = 5, projectId = '') {
  const items = [];
  const backlogTitles = [
    'Como usuário quero filtrar por data',
    'Melhorar acessibilidade do sistema',
    'Suporte a múltiplos idiomas',
    'Exportar relatórios em PDF',
    'Integração com Slack',
    'Modo escuro automático',
    'Upload de arquivos nas tarefas',
    'Histórico de atividades do projeto'
  ];

  for (let i = 0; i < count; i++) {
    items.push({
      id: 'bl_gen_' + Date.now().toString() + '_' + i,
      projectId: projectId,
      title: backlogTitles[i % backlogTitles.length],
      description: `Item de backlog gerado para demonstração. #${i + 1}`,
      storyPoints: [1, 2, 3, 5, 8][i % 5],
      priority: PRIORITIES[i % PRIORITIES.length],
      status: 'backlog',
      sprintId: '',
      createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return items;
}

// Exporta para uso global
window.generateSampleTasks = generateSampleTasks;
window.generateSampleBacklogItems = generateSampleBacklogItems;