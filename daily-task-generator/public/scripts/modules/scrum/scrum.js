/**
 * Scrum - Ferramentas completas de Scrum
 * Gerencia sprints, backlog, daily standups e retrospectivas
 */

class ScrumManager {
  constructor() {
    this.currentProjectId = null;
  }

  // ==================== PROJETOS ====================

  async createProject(name, description, ownerId, members = []) {
    const project = {
      id: 'proj_' + Date.now().toString(),
      name,
      description,
      ownerId,
      memberIds: [ownerId, ...members],
      createdAt: new Date().toISOString(),
      status: 'active',
      settings: {
        sprintDuration: 14, // dias
        pointScale: 'fibonacci', // fibonacci, t-shirt, linear
        defaultColumnTemplate: 'scrum' // scrum, kanban, custom
      }
    };
    
    await db.add(STORES.PROJECTS, project);
    
    // Cria colunas padrão do kanban para o projeto
    await this._createDefaultColumns(project.id);
    
    return project;
  }

  async getProject(projectId) {
    return await db.get(STORES.PROJECTS, projectId);
  }

  async getUserProjects(userId) {
    return await db.getByIndex(STORES.PROJECTS, 'memberIds', userId);
  }

  async addProjectMember(projectId, userId) {
    const project = await db.get(STORES.PROJECTS, projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    if (!project.memberIds.includes(userId)) {
      project.memberIds.push(userId);
      await db.put(STORES.PROJECTS, project);
    }
    
    return project;
  }

  async removeProjectMember(projectId, userId) {
    const project = await db.get(STORES.PROJECTS, projectId);
    if (!project) throw new Error('Projeto não encontrado');
    
    project.memberIds = project.memberIds.filter(id => id !== userId);
    await db.put(STORES.PROJECTS, project);
    
    return project;
  }

  // ==================== TAREFAS ====================

  async createTask(taskData) {
    const task = {
      id: 'task_' + Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo || '',
      createdBy: taskData.createdBy,
      sprintId: taskData.sprintId || '',
      columnId: taskData.columnId || 'backlog',
      status: 'pending',
      priority: taskData.priority || 'medium', // critical, high, medium, low, trivial
      storyPoints: taskData.storyPoints || 0,
      type: taskData.type || 'task', // task, bug, feature, improvement, epic
      labels: taskData.labels || [],
      dueDate: taskData.dueDate || '',
      estimatedHours: taskData.estimatedHours || 0,
      spentHours: taskData.spentHours || 0,
      attachments: [],
      comments: [],
      subtasks: [],
      blockers: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: ''
    };
    
    await db.add(STORES.TASKS, task);
    return task;
  }

  async updateTask(taskId, updates) {
    const task = await db.get(STORES.TASKS, taskId);
    if (!task) throw new Error('Tarefa não encontrada');
    
    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();
    
    if (updates.status === 'done' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    
    await db.put(STORES.TASKS, task);
    
    // Dispara evento de atualização
    window.dispatchEvent(new CustomEvent('task:update', { detail: { task } }));
    
    return task;
  }

  async getTask(taskId) {
    return await db.get(STORES.TASKS, taskId);
  }

  async getProjectTasks(projectId) {
    return await db.getByIndex(STORES.TASKS, 'projectId', projectId);
  }

  async getTasksByColumn(projectId, columnId) {
    const tasks = await db.getByIndex(STORES.TASKS, 'projectId', projectId);
    return tasks.filter(t => t.columnId === columnId);
  }

  async getTasksBySprint(sprintId) {
    return await db.getByIndex(STORES.TASKS, 'sprintId', sprintId);
  }

  async getUserTasks(userId) {
    return await db.getByIndex(STORES.TASKS, 'assignedTo', userId);
  }

  async deleteTask(taskId) {
    await db.delete(STORES.TASKS, taskId);
    window.dispatchEvent(new CustomEvent('task:delete', { detail: { taskId } }));
  }

  async addTaskComment(taskId, userId, userName, comment) {
    const task = await db.get(STORES.TASKS, taskId);
    if (!task) throw new Error('Tarefa não encontrada');
    
    task.comments.push({
      id: 'cmt_' + Date.now().toString(),
      userId,
      userName,
      text: comment,
      timestamp: new Date().toISOString()
    });
    
    task.updatedAt = new Date().toISOString();
    await db.put(STORES.TASKS, task);
    
    return task;
  }

  async addTaskSubtask(taskId, title) {
    const task = await db.get(STORES.TASKS, taskId);
    if (!task) throw new Error('Tarefa não encontrada');
    
    task.subtasks.push({
      id: 'sub_' + Date.now().toString(),
      title,
      completed: false
    });
    
    task.updatedAt = new Date().toISOString();
    await db.put(STORES.TASKS, task);
    
    return task;
  }

  async toggleSubtask(taskId, subtaskId) {
    const task = await db.get(STORES.TASKS, taskId);
    if (!task) throw new Error('Tarefa não encontrada');
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      task.updatedAt = new Date().toISOString();
      await db.put(STORES.TASKS, task);
    }
    
    return task;
  }

  // ==================== SPRINTS ====================

  async createSprint(projectId, name, startDate, endDate, goal = '') {
    const sprint = {
      id: 'sprint_' + Date.now().toString(),
      projectId,
      name,
      goal,
      startDate,
      endDate,
      status: 'planning', // planning, active, completed
      totalPoints: 0,
      completedPoints: 0,
      createdAt: new Date().toISOString(),
      completedAt: ''
    };
    
    await db.add(STORES.SPRINTS, sprint);
    return sprint;
  }

  async startSprint(sprintId) {
    const sprint = await db.get(STORES.SPRINTS, sprintId);
    if (!sprint) throw new Error('Sprint não encontrada');
    
    sprint.status = 'active';
    await db.put(STORES.SPRINTS, sprint);
    
    // Atualiza tarefas da sprint
    const tasks = await db.getByIndex(STORES.TASKS, 'sprintId', sprintId);
    for (const task of tasks) {
      if (task.status === 'pending') {
        task.status = 'in-progress';
        await db.put(STORES.TASKS, task);
      }
    }
    
    window.dispatchEvent(new CustomEvent('sprint:start', { detail: { sprint } }));
    return sprint;
  }

  async completeSprint(sprintId) {
    const sprint = await db.get(STORES.SPRINTS, sprintId);
    if (!sprint) throw new Error('Sprint não encontrada');
    
    sprint.status = 'completed';
    sprint.completedAt = new Date().toISOString();
    await db.put(STORES.SPRINTS, sprint);
    
    window.dispatchEvent(new CustomEvent('sprint:complete', { detail: { sprint } }));
    return sprint;
  }

  async getSprint(sprintId) {
    return await db.get(STORES.SPRINTS, sprintId);
  }

  async getProjectSprints(projectId) {
    return await db.getByIndex(STORES.SPRINTS, 'projectId', projectId);
  }

  async getActiveSprint(projectId) {
    const sprints = await db.getByIndex(STORES.SPRINTS, 'projectId', projectId);
    return sprints.find(s => s.status === 'active') || null;
  }

  async getSprintBurndown(sprintId) {
    const tasks = await db.getByIndex(STORES.TASKS, 'sprintId', sprintId);
    const sprint = await db.get(STORES.SPRINTS, sprintId);
    
    if (!sprint) return [];
    
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const burndownData = [];
    
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedPoints = tasks
        .filter(t => t.completedAt && t.completedAt.split('T')[0] <= dateStr)
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
      burndownData.push({
        date: dateStr,
        ideal: totalPoints - (totalPoints / totalDays) * day,
        actual: totalPoints - completedPoints
      });
    }
    
    return burndownData;
  }

  // ==================== BACKLOG ====================

  async addToBacklog(projectId, title, description = '', storyPoints = 0, priority = 'medium') {
    const item = {
      id: 'bl_' + Date.now().toString(),
      projectId,
      title,
      description,
      storyPoints,
      priority,
      status: 'backlog', // backlog, refined, ready, committed
      sprintId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.add(STORES.BACKLOG, item);
    return item;
  }

  async refineBacklogItem(backlogId, updates) {
    const item = await db.get(STORES.BACKLOG, backlogId);
    if (!item) throw new Error('Item de backlog não encontrado');
    
    Object.assign(item, updates);
    item.updatedAt = new Date().toISOString();
    await db.put(STORES.BACKLOG, item);
    
    return item;
  }

  async moveBacklogToSprint(backlogId, sprintId) {
    const item = await db.get(STORES.BACKLOG, backlogId);
    if (!item) throw new Error('Item de backlog não encontrado');
    
    item.sprintId = sprintId;
    item.status = 'committed';
    item.updatedAt = new Date().toISOString();
    await db.put(STORES.BACKLOG, item);
    
    // Cria tarefa correspondente no sprint
    await this.createTask({
      title: item.title,
      description: item.description,
      projectId: item.projectId,
      assignedTo: '',
      createdBy: '',
      sprintId,
      priority: item.priority,
      storyPoints: item.storyPoints
    });
    
    return item;
  }

  async getProjectBacklog(projectId) {
    return await db.getByIndex(STORES.BACKLOG, 'projectId', projectId);
  }

  async getSprintBacklog(sprintId) {
    return await db.getByIndex(STORES.BACKLOG, 'sprintId', sprintId);
  }

  // ==================== DAILY STANDUPS ====================

  async createStandup(projectId, userId, userName, yesterday, today, blockers) {
    const standup = {
      id: 'std_' + Date.now().toString(),
      projectId,
      userId,
      userName,
      date: new Date().toISOString().split('T')[0],
      yesterday,
      today,
      blockers,
      createdAt: new Date().toISOString()
    };
    
    await db.add(STORES.STANDUPS, standup);
    return standup;
  }

  async getTodayStandups(projectId) {
    const today = new Date().toISOString().split('T')[0];
    const allStandups = await db.getByIndex(STORES.STANDUPS, 'date', today);
    // Filtra por projeto para evitar misturar dados de projetos diferentes
    return allStandups.filter(s => s.projectId === projectId);
  }

  async getStandupByUserDate(projectId, userId, date) {
    const standups = await db.getByIndex(STORES.STANDUPS, 'projectId', projectId);
    return standups.find(s => s.userId === userId && s.date === date) || null;
  }

  // ==================== RETROSPECTIVAS ====================

  async createRetrospective(projectId, sprintId, data) {
    const retro = {
      id: 'retro_' + Date.now().toString(),
      projectId,
      sprintId,
      wentWell: data.wentWell || [],
      toImprove: data.toImprove || [],
      actionItems: data.actionItems || [],
      appreciation: data.appreciation || '',
      createdAt: new Date().toISOString()
    };
    
    await db.add(STORES.RETROSPECTIVES, retro);
    return retro;
  }

  async getSprintRetrospective(sprintId) {
    const retros = await db.getByIndex(STORES.RETROSPECTIVES, 'sprintId', sprintId);
    return retros.length > 0 ? retros[0] : null;
  }

  async getProjectRetrospectives(projectId) {
    return await db.getByIndex(STORES.RETROSPECTIVES, 'projectId', projectId);
  }

  async addRetroItem(retroId, section, text) {
    const retro = await db.get(STORES.RETROSPECTIVES, retroId);
    if (!retro) throw new Error('Retrospectiva não encontrada');
    
    retro[section].push({ id: 'ritem_' + Date.now().toString(), text, votes: 0 });
    await db.put(STORES.RETROSPECTIVES, retro);
    
    return retro;
  }

  // ==================== COLUNAS KANBAN ====================

  async _createDefaultColumns(projectId) {
    const defaultColumns = [
      { id: 'col_' + projectId + '_backlog', projectId, title: 'Backlog', order: 0, color: '#6b7280', wipLimit: 0 },
      { id: 'col_' + projectId + '_todo', projectId, title: 'A Fazer', order: 1, color: '#3b82f6', wipLimit: 0 },
      { id: 'col_' + projectId + '_inprogress', projectId, title: 'Em Andamento', order: 2, color: '#f59e0b', wipLimit: 5 },
      { id: 'col_' + projectId + '_review', projectId, title: 'Revisão', order: 3, color: '#8b5cf6', wipLimit: 3 },
      { id: 'col_' + projectId + '_done', projectId, title: 'Concluído', order: 4, color: '#22c55e', wipLimit: 0 }
    ];
    
    for (const col of defaultColumns) {
      await db.add(STORES.COLUMNS, col);
    }
  }

  async getProjectColumns(projectId) {
    const columns = await db.getByIndex(STORES.COLUMNS, 'projectId', projectId);
    return columns.sort((a, b) => a.order - b.order);
  }

  async addCustomColumn(projectId, title, color = '#6b7280', wipLimit = 0) {
    const columns = await this.getProjectColumns(projectId);
    const maxOrder = columns.reduce((max, c) => Math.max(max, c.order), -1);
    
    const column = {
      id: 'col_' + Date.now().toString(),
      projectId,
      title,
      order: maxOrder + 1,
      color,
      wipLimit
    };
    
    await db.add(STORES.COLUMNS, column);
    return column;
  }

  async updateColumn(columnId, updates) {
    const column = await db.get(STORES.COLUMNS, columnId);
    if (!column) throw new Error('Coluna não encontrada');
    
    Object.assign(column, updates);
    await db.put(STORES.COLUMNS, column);
    
    return column;
  }

  async deleteColumn(columnId) {
    // Move tarefas para backlog antes de deletar
    const column = await db.get(STORES.COLUMNS, columnId);
    if (column) {
      const tasks = await db.getByIndex(STORES.TASKS, 'columnId', columnId);
      // Mover tarefas para primeira coluna
      const projectColumns = await this.getProjectColumns(column.projectId);
      const firstColumn = projectColumns.find(c => c.id !== columnId);
      if (firstColumn) {
        for (const task of tasks) {
          task.columnId = firstColumn.id;
          await db.put(STORES.TASKS, task);
        }
      }
    }
    
    await db.delete(STORES.COLUMNS, columnId);
  }

  async reorderColumns(projectId, columnIds) {
    const columns = await this.getProjectColumns(projectId);
    
    for (let i = 0; i < columnIds.length; i++) {
      const column = columns.find(c => c.id === columnIds[i]);
      if (column) {
        column.order = i;
        await db.put(STORES.COLUMNS, column);
      }
    }
  }

  // ==================== ESTATÍSTICAS ====================

  async getProjectStats(projectId) {
    const tasks = await this.getProjectTasks(projectId);
    const sprints = await this.getProjectSprints(projectId);
    const columns = await this.getProjectColumns(projectId);
    
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completedAt).length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completedAt).length,
      tasksByColumn: {},
      tasksByMember: {},
      totalStoryPoints: tasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
      completedStoryPoints: tasks.filter(t => t.completedAt).reduce((s, t) => s + (t.storyPoints || 0), 0),
      taskTypes: {
        task: tasks.filter(t => t.type === 'task').length,
        bug: tasks.filter(t => t.type === 'bug').length,
        feature: tasks.filter(t => t.type === 'feature').length,
        improvement: tasks.filter(t => t.type === 'improvement').length,
        epic: tasks.filter(t => t.type === 'epic').length
      }
    };
    
    // Tarefas por coluna
    for (const col of columns) {
      stats.tasksByColumn[col.id] = tasks.filter(t => t.columnId === col.id).length;
    }
    
    // Tarefas por membro
    const memberCounts = {};
    for (const task of tasks) {
      if (task.assignedTo) {
        memberCounts[task.assignedTo] = (memberCounts[task.assignedTo] || 0) + 1;
      }
    }
    stats.tasksByMember = memberCounts;
    
    return stats;
  }

  async getVelocity(projectId, lastSprints = 5) {
    const sprints = await this.getProjectSprints(projectId);
    const completedSprints = sprints
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, lastSprints);
    
    const velocity = [];
    
    for (const sprint of completedSprints) {
      const tasks = await this.getTasksBySprint(sprint.id);
      const points = tasks.filter(t => t.completedAt).reduce((s, t) => s + (t.storyPoints || 0), 0);
      
      velocity.push({
        sprintName: sprint.name,
        completedPoints: points
      });
    }
    
    return velocity;
  }
}

// Singleton
const scrumManager = new ScrumManager();
window.scrumManager = scrumManager;