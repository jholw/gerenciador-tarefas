/**
 * kanban.js - Módulo do Quadro Kanban
 * Gerencia renderização, drag & drop, modais e personalização do quadro
 */

class KanbanBoard {
  constructor() {
    this.currentProjectId = null;
  }

  // ==================== INICIALIZAÇÃO ====================

  init(projectId) {
    this.currentProjectId = projectId;
  }

  // ==================== RENDERIZAÇÃO DO QUADRO ====================

  async render() {
    if (!this.currentProjectId) return;

    const boardGrid = document.getElementById('board-grid');
    boardGrid.innerHTML = '';

    const columns = await scrumManager.getProjectColumns(this.currentProjectId);

    if (columns.length === 0) {
      boardGrid.innerHTML = '<p class="empty-state">Nenhuma coluna configurada. Personalize o quadro primeiro.</p>';
      return;
    }

    for (const column of columns) {
      const tasks = await scrumManager.getTasksByColumn(this.currentProjectId, column.id);

      const colEl = document.createElement('div');
      colEl.className = 'kanban-column';
      colEl.dataset.columnId = column.id;
      colEl.innerHTML = `
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span class="column-color" style="background: ${column.color}"></span>
            <span>${escapeHtml(column.title)}</span>
          </div>
          <span class="column-count">${tasks.length}${column.wipLimit > 0 ? `/${column.wipLimit}` : ''}</span>
        </div>
        <div class="kanban-column-body" data-column="${column.id}">
          ${tasks.length === 0 ? '<p class="empty-state" style="padding: 20px">Nenhuma tarefa</p>' : ''}
        </div>
      `;

      const body = colEl.querySelector('.kanban-column-body');

      for (const task of tasks) {
        const card = this._createCard(task);
        body.appendChild(card);
      }

      this._setupDropZone(body);
      boardGrid.appendChild(colEl);
    }
  }

  _createCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.taskId = task.id;

    const assigneeInitial = task.assignedTo ? task.assignedTo.charAt(0).toUpperCase() : '';

    card.innerHTML = `
      <div class="kanban-card-top">
        <h4 class="kanban-card-title">${escapeHtml(task.title)}</h4>
        <span class="kanban-card-type">${TYPE_LABELS[task.type] || task.type}</span>
      </div>
      ${task.description ? `<p class="kanban-card-body">${escapeHtml(task.description)}</p>` : ''}
      <div class="kanban-card-footer">
        <div class="kanban-card-meta">
          <span class="priority-indicator ${task.priority}"></span>
          ${task.dueDate ? `<span>${formatDate(task.dueDate)}</span>` : ''}
          ${task.storyPoints > 0 ? `<span class="kanban-card-points">${task.storyPoints}pts</span>` : ''}
        </div>
        ${assigneeInitial ? `<div class="kanban-card-assignee">${assigneeInitial}</div>` : ''}
      </div>
    `;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Double-click to view details
    card.addEventListener('dblclick', () => {
      this.openTaskDetail(task.id);
    });

    return card;
  }

  _setupDropZone(zone) {
    const columnId = zone.dataset.column;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drop-target');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drop-target');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drop-target');

      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId && columnId) {
        try {
          await scrumManager.updateTask(taskId, { columnId });
          await this.render();

          // Notifica no chat
          const task = await scrumManager.getTask(taskId);
          if (task) {
            const projectColumns = await scrumManager.getProjectColumns(this.currentProjectId);
            const col = projectColumns.find(c => c.id === columnId);
            if (col) {
              chatManager.sendSystemMessage(this.currentProjectId,
                `📋 Tarefa "${task.title}" movida para "${col.title}"`);
            }
          }
        } catch (err) {
          showNotification('Erro', err.message, 'error');
        }
      }
    });
  }

  // ==================== POPULATE FORM ====================

  async populateTaskForm() {
    const columnSelect = document.getElementById('task-column');
    columnSelect.innerHTML = '<option value="">Selecione uma coluna...</option>';
    const columns = await scrumManager.getProjectColumns(this.currentProjectId);
    for (const col of columns) {
      const option = document.createElement('option');
      option.value = col.id;
      option.textContent = col.title;
      columnSelect.appendChild(option);
    }

    const assigneeSelect = document.getElementById('task-assignee');
    assigneeSelect.innerHTML = '<option value="">Sem responsável</option>';
    try {
      const project = await scrumManager.getProject(this.currentProjectId);
      if (project && project.memberIds) {
        for (const memberId of project.memberIds) {
          const user = await auth.getUserById(memberId);
          if (user) {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            assigneeSelect.appendChild(option);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar membros:', err);
    }

    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('task-points').value = '1';
  }

  // ==================== PERSONALIZAR QUADRO ====================

  async openCustomize() {
    openModal('modal-customize-board');

    const columnList = document.getElementById('column-list');
    columnList.innerHTML = '';

    const columns = await scrumManager.getProjectColumns(this.currentProjectId);

    columns.forEach((col) => {
      const item = document.createElement('div');
      item.className = 'backlog-item';
      item.innerHTML = `
        <span style="color:${col.color}; font-size: 1.2rem;">⬤</span>
        <div class="backlog-item-info">
          <div class="backlog-item-title">${escapeHtml(col.title)}</div>
          <div class="backlog-item-meta">
            <span>Limite WIP: ${col.wipLimit || 'Sem limite'}</span>
          </div>
        </div>
        <button class="btn-icon" data-column-id="${col.id}" title="Remover">🗑️</button>
      `;

      const deleteBtn = item.querySelector('.btn-icon');
      deleteBtn.addEventListener('click', async () => {
        await this.deleteColumn(col.id);
        await this.openCustomize();
      });

      columnList.appendChild(item);
    });

    document.getElementById('btn-add-column').onclick = async () => {
      const title = prompt('Nome da nova coluna:');
      if (title && title.trim()) {
        await scrumManager.addCustomColumn(this.currentProjectId, title.trim());
        await this.openCustomize();
      }
    };

    document.getElementById('btn-save-columns').onclick = async () => {
      closeModal('modal-customize-board');
      await this.render();
      showNotification('Quadro atualizado', 'As colunas foram salvas com sucesso', 'success');
    };
  }

  async deleteColumn(columnId) {
    if (!confirm('Tem certeza que deseja remover esta coluna? As tarefas serão movidas.')) return;

    const columns = await scrumManager.getProjectColumns(this.currentProjectId);

    // Se só houver 1 coluna, cria uma nova antes de deletar
    if (columns.length <= 1) {
      await scrumManager.addCustomColumn(this.currentProjectId, 'Backlog', '#6b7280', 0);
      showNotification('Coluna "Backlog" criada automaticamente', 'Era a única coluna restante', 'info');
    }

    await scrumManager.deleteColumn(columnId);
  }

  // ==================== DETALHES DA TAREFA ====================

  async openTaskDetail(taskId) {
    const task = await scrumManager.getTask(taskId);
    if (!task) return;

    const body = document.getElementById('task-detail-body');
    const user = task.assignedTo ? await auth.getUserById(task.assignedTo) : null;

    body.innerHTML = `
      <div class="form-group">
        <label>Título</label>
        <input type="text" id="detail-title" value="${escapeHtml(task.title)}">
      </div>
      <div class="form-group">
        <label>Descrição</label>
        <textarea id="detail-description" rows="3">${escapeHtml(task.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Prioridade</label>
          <select id="detail-priority">
            ${PRIORITY_OPTIONS.map(o =>
              `<option value="${o.value}" ${task.priority === o.value ? 'selected' : ''}>${o.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="detail-status">
            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pendente</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>Em Andamento</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Concluído</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Responsável: ${user ? user.name : 'Nenhum'}</label>
      </div>
      <div class="form-group">
        <label>Tipo: ${TYPE_LABELS[task.type] || task.type}</label>
      </div>
      <div class="form-group">
        <label>Story Points: ${task.storyPoints || 0}</label>
      </div>
      ${task.dueDate ? `<div class="form-group"><label>Prazo: ${formatDate(task.dueDate)}</label></div>` : ''}

      <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">

      <h4 style="margin: 0 0 12px;">Subtarefas</h4>
      <div id="detail-subtasks">
        ${task.subtasks && task.subtasks.length > 0
          ? task.subtasks.map(st => `
            <div class="backlog-item" style="cursor: pointer;" data-subtask-id="${st.id}">
              <span>${st.completed ? '✅' : '⬜'}</span>
              <span style="${st.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(st.title)}</span>
            </div>
          `).join('')
          : '<p class="empty-state">Nenhuma subtarefa</p>'}
      </div>

      <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">

      <div class="form-row">
        <div class="form-group">
          <input type="text" id="new-subtask" placeholder="Nova subtarefa...">
        </div>
        <button class="btn-action" id="btn-add-subtask">+ Adicionar</button>
      </div>

      <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">

      <h4 style="margin: 0 0 12px;">Comentários</h4>
      <div id="detail-comments">
        ${task.comments && task.comments.length > 0
          ? task.comments.map(c => `
            <div class="standup-entry">
              <div class="standup-entry-header">
                <strong>${escapeHtml(c.userName)}</strong>
                <span class="standup-entry-date">${formatDateTime(c.timestamp)}</span>
              </div>
              <p class="standup-entry-text">${escapeHtml(c.text)}</p>
            </div>
          `).join('')
          : '<p class="empty-state">Nenhum comentário</p>'}
      </div>

      <div class="form-row">
        <div class="form-group">
          <textarea id="new-comment" placeholder="Adicionar comentário..." rows="2"></textarea>
        </div>
        <button class="btn-action" id="btn-add-comment">💬 Comentar</button>
      </div>

      <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">

      <div style="display: flex; gap: 10px;">
        <button class="btn-primary btn-full" id="btn-save-task-detail">💾 Salvar</button>
        <button class="btn-action btn-danger btn-full" id="btn-delete-task">🗑️ Excluir</button>
      </div>
    `;

    document.getElementById('task-detail-title').textContent = `📋 ${task.title}`;

    // Event listeners
    this._setupDetailListeners(taskId, task);

    openModal('modal-task-detail');
  }

  _setupDetailListeners(taskId, task) {
    // Toggle subtask
    document.querySelectorAll('#detail-subtasks .backlog-item').forEach(el => {
      el.addEventListener('click', async () => {
        const subtaskId = el.dataset.subtaskId;
        if (subtaskId) {
          await scrumManager.toggleSubtask(taskId, subtaskId);
          await this.openTaskDetail(taskId);
        }
      });
    });

    // Add subtask
    document.getElementById('btn-add-subtask').addEventListener('click', async () => {
      const input = document.getElementById('new-subtask');
      const title = input.value.trim();
      if (title) {
        await scrumManager.addTaskSubtask(taskId, title);
        input.value = '';
        await this.openTaskDetail(taskId);
      }
    });

    // Add comment
    document.getElementById('btn-add-comment').addEventListener('click', async () => {
      const text = document.getElementById('new-comment').value.trim();
      if (text) {
        await scrumManager.addTaskComment(taskId, auth.getCurrentUser().id, auth.getCurrentUser().name, text);
        document.getElementById('new-comment').value = '';

        const taskUpdated = await scrumManager.getTask(taskId);
        chatManager.sendMessage(`💬 Novo comentário em "${taskUpdated.title}": ${text}`, taskId);

        await this.openTaskDetail(taskId);
      }
    });

    // Save
    document.getElementById('btn-save-task-detail').addEventListener('click', async () => {
      const updates = {
        title: document.getElementById('detail-title').value.trim(),
        description: document.getElementById('detail-description').value.trim(),
        priority: document.getElementById('detail-priority').value,
        status: document.getElementById('detail-status').value
      };

      try {
        await scrumManager.updateTask(taskId, updates);
        closeModal('modal-task-detail');
        await this.render();
        showNotification('Tarefa atualizada', 'As alterações foram salvas', 'success');
      } catch (err) {
        showNotification('Erro', err.message, 'error');
      }
    });

    // Delete
    document.getElementById('btn-delete-task').addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        await scrumManager.deleteTask(taskId);
        closeModal('modal-task-detail');
        await this.render();
        showNotification('Tarefa excluída', 'A tarefa foi removida', 'success');
      }
    });
  }
}

// Singleton
const kanbanBoard = new KanbanBoard();
window.kanbanBoard = kanbanBoard;