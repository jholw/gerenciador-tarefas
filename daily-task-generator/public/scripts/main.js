/**
 * main.js - Controlador principal do Gerenciador de Tarefas
 * Integra todos os módulos: autenticação, scrum, kanban, chat, lembretes
 */

// ==================== ESTADO GLOBAL ====================
let currentProjectId = null;
let currentUser = null;

// ==================== INICIALIZAÇÃO PRINCIPAL ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializa banco de dados
        await db.open();
        
        // Inicializa autenticação
        await auth.init();
        
        // Verifica autenticação
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = auth.getCurrentUser();
        
        // Inicializa módulos
        await reminderManager.init();
        
        // Configura interface
        setupUserProfile();
        setupNavigation();
        setupProjectSelector();
        setupModals();
        setupBoard();
        setupBacklog();
        setupSprints();
        setupStandup();
        setupRetrospective();
        setupReminders();
        setupStats();
        setupChat();
        setupMembers();
        setupSettings();
        setupNotifications();
        setupEventListeners();
        setupWelcomeDashboard();
        setupSectionIntros();
        
        // Carrega projetos do usuário
        await loadUserProjects();
        
        console.log('✅ Sistema inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNotification('Erro ao inicializar sistema', error.message, 'error');
    }
});

// ==================== PERFIL DO USUÁRIO ====================
function setupUserProfile() {
    if (!currentUser) return;
    
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-email').textContent = currentUser.email;
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        chatManager.stopPolling();
        reminderManager.stop();
        await auth.logout();
        window.location.href = 'login.html';
    });
}

// ==================== WELCOME DASHBOARD ====================
function setupWelcomeDashboard() {
    document.getElementById('welcome-btn-new-project').addEventListener('click', () => {
        openModal('modal-project');
    });
    
    document.getElementById('welcome-btn-board-help').addEventListener('click', () => {
        showNotification('💡 Como usar o TaskFlow',
            '1. Crie ou selecione um projeto na barra lateral\n' +
            '2. Adicione tarefas ao Quadro Kanban\n' +
            '3. Planeje Sprints pelo Backlog\n' +
            '4. Registre Daily Standups\n' +
            '5. Acompanhe métricas em Estatísticas',
            'info');
    });
}

function showWelcomeDashboard(visible) {
    const welcome = document.getElementById('welcome-dashboard');
    const boardContent = document.getElementById('board-content');
    const section = document.getElementById('section-board');
    
    if (!welcome || !boardContent) return;
    
    if (visible) {
        welcome.style.display = 'flex';
        boardContent.style.display = 'none';
        section.classList.remove('has-project');
    } else {
        welcome.style.display = 'none';
        boardContent.style.display = 'block';
        section.classList.add('has-project');
    }
}

// ==================== SECTION INTROS ====================
function setupSectionIntros() {
    // Esses elementos são gerenciados dinamicamente no selectProject
}

function showSectionIntros(hasProject) {
    // Se não tem projeto selecionado, mostra intros em todas as seções
    const sections = ['backlog', 'sprints', 'standup', 'retro', 'stats', 'chat', 'members'];
    
    sections.forEach(id => {
        const intro = document.getElementById(`${id}-intro`);
        if (intro) {
            if (hasProject) {
                intro.classList.remove('visible');
            } else {
                intro.classList.add('visible');
            }
        }
    });
}

// ==================== NAVEGAÇÃO ====================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const sectionId = item.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(`section-${sectionId}`);
            if (section) section.classList.add('active');
        });
    });
}

// ==================== SELETOR DE PROJETO ====================
function setupProjectSelector() {
    const select = document.getElementById('project-select');
    
    select.addEventListener('change', async () => {
        currentProjectId = select.value;
        if (currentProjectId) {
            await loadProjectData();
            await selectProject(currentProjectId);
            showWelcomeDashboard(false);
            showSectionIntros(true);
        } else {
            showWelcomeDashboard(true);
            showSectionIntros(false);
            // Limpa visualizações
            document.getElementById('board-grid').innerHTML = '';
            document.getElementById('backlog-list').innerHTML = '<p class="empty-state">Selecione um projeto para ver o backlog.</p>';
            document.getElementById('sprint-list').innerHTML = '';
            document.getElementById('standup-entries').innerHTML = '';
            document.getElementById('members-container').innerHTML = '<p class="empty-state">Selecione um projeto para ver os membros.</p>';
            document.getElementById('chat-messages').innerHTML = '<p class="empty-state">Selecione um projeto para acessar o chat.</p>';
        }
    });
    
    document.getElementById('btn-new-project').addEventListener('click', () => {
        openModal('modal-project');
    });
    
    // Formulário novo projeto
    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('project-name').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const duration = parseInt(document.getElementById('project-sprint-duration').value);
        
        if (!name) {
            showNotification('Atenção', 'O nome do projeto é obrigatório', 'warning');
            return;
        }
        
        try {
            const project = await scrumManager.createProject(name, description, currentUser.id);
            
            // Atualiza configuração de sprint
            project.settings.sprintDuration = duration;
            await db.put(STORES.PROJECTS, project);
            
            closeModal('modal-project');
            document.getElementById('project-form').reset();
            
            await loadUserProjects();
            document.getElementById('project-select').value = project.id;
            currentProjectId = project.id;
            showWelcomeDashboard(false);
            showSectionIntros(true);
            await selectProject(project.id);
            
            showNotification('Projeto criado', `"${name}" foi criado com sucesso!`, 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
}

async function loadUserProjects() {
    const projects = await scrumManager.getUserProjects(currentUser.id);
    const select = document.getElementById('project-select');
    
    select.innerHTML = '<option value="">Selecione um projeto</option>';
    
    for (const project of projects) {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    }
    
    // Se não tem projetos, mantem welcome
    if (projects.length === 0) {
        showWelcomeDashboard(true);
        showSectionIntros(false);
    }
}

async function selectProject(projectId) {
    currentProjectId = projectId;
    
    // Inicializa chat
    await chatManager.init(projectId, currentUser.id, currentUser.name);
    
    // Renderiza quadro
    await renderBoard();
    await renderBacklog();
    await renderSprints();
    await renderStandups();
    await renderReminders();
    await renderStats();
    await renderMembers();
    await loadChat();
}

async function loadProjectData() {
    if (!currentProjectId) return;
    const project = await scrumManager.getProject(currentProjectId);
    if (project) {
        document.getElementById('chat-project-name').textContent = `- ${project.name}`;
    }
}

// ==================== MODAIS ====================
function setupModals() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) closeModal(modal.id);
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ==================== QUADRO KANBAN ====================
function setupBoard() {
    // Nova tarefa
    document.getElementById('btn-add-task').addEventListener('click', () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        populateTaskForm();
        openModal('modal-task');
    });
    
    // Personalizar quadro
    document.getElementById('btn-customize-board').addEventListener('click', () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        openCustomizeBoard();
    });
    
    // Formulário de tarefa
    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titleInput = document.getElementById('task-title');
        const columnInput = document.getElementById('task-column');
        
        if (!titleInput.value.trim()) {
            showNotification('Atenção', 'O título da tarefa é obrigatório', 'warning');
            titleInput.focus();
            return;
        }
        
        if (!columnInput.value) {
            showNotification('Atenção', 'Selecione uma coluna para a tarefa', 'warning');
            columnInput.focus();
            return;
        }
        
        const taskData = {
            title: titleInput.value.trim(),
            description: document.getElementById('task-description').value.trim(),
            projectId: currentProjectId,
            createdBy: currentUser.id,
            assignedTo: document.getElementById('task-assignee').value,
            columnId: columnInput.value,
            priority: document.getElementById('task-priority').value,
            type: document.getElementById('task-type').value,
            storyPoints: parseInt(document.getElementById('task-points').value) || 0,
            dueDate: document.getElementById('task-due').value
        };
        
        try {
            await scrumManager.createTask(taskData);
            closeModal('modal-task');
            document.getElementById('task-form').reset();
            await renderBoard();
            showNotification('Tarefa criada', `"${taskData.title}" foi adicionada ao quadro`, 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
}

async function populateTaskForm() {
    // Preenche colunas - sempre mantém a opção placeholder
    const columnSelect = document.getElementById('task-column');
    columnSelect.innerHTML = '<option value="">Selecione uma coluna...</option>';
    const columns = await scrumManager.getProjectColumns(currentProjectId);
    for (const col of columns) {
        const option = document.createElement('option');
        option.value = col.id;
        option.textContent = col.title;
        columnSelect.appendChild(option);
    }
    
    // Preenche membros
    const assigneeSelect = document.getElementById('task-assignee');
    assigneeSelect.innerHTML = '<option value="">Sem responsável</option>';
    try {
        const project = await scrumManager.getProject(currentProjectId);
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
    
    // Limpa campos
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('task-points').value = '1';
}

async function renderBoard() {
    if (!currentProjectId) return;
    
    const boardGrid = document.getElementById('board-grid');
    boardGrid.innerHTML = '';
    
    const columns = await scrumManager.getProjectColumns(currentProjectId);
    
    if (columns.length === 0) {
        boardGrid.innerHTML = '<p class="empty-state">Nenhuma coluna configurada. Personalize o quadro primeiro.</p>';
        return;
    }
    
    for (const column of columns) {
        const tasks = await scrumManager.getTasksByColumn(currentProjectId, column.id);
        
        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.columnId = column.id;
        colEl.innerHTML = `
            <div class="kanban-column-header">
                <div class="kanban-column-title">
                    <span class="column-color" style="background: ${column.color}"></span>
                    <span>${column.title}</span>
                </div>
                <span class="column-count">${tasks.length}${column.wipLimit > 0 ? `/${column.wipLimit}` : ''}</span>
            </div>
            <div class="kanban-column-body" data-column="${column.id}">
                ${tasks.length === 0 ? '<p class="empty-state" style="padding: 20px">Nenhuma tarefa</p>' : ''}
            </div>
        `;
        
        const body = colEl.querySelector('.kanban-column-body');
        
        for (const task of tasks) {
            const card = createKanbanCard(task);
            body.appendChild(card);
        }
        
        // Drop zone
        setupDropZone(body);
        
        boardGrid.appendChild(colEl);
    }
}

function createKanbanCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    
    const typeLabels = { task: 'Tarefa', bug: 'Bug', feature: 'Funcionalidade', improvement: 'Melhoria', epic: 'Épico' };
    const priorityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e', trivial: '#6b7280' };
    
    const assigneeInitial = task.assignedTo ? task.assignedTo.charAt(0).toUpperCase() : '';
    
    card.innerHTML = `
        <div class="kanban-card-top">
            <h4 class="kanban-card-title">${escapeHtml(task.title)}</h4>
            <span class="kanban-card-type">${typeLabels[task.type] || task.type}</span>
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
    
    // Click to view details
    card.addEventListener('dblclick', () => {
        openTaskDetail(task.id);
    });
    
    return card;
}

function setupDropZone(zone) {
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
                await renderBoard();
                
                // Envia notificação no chat
                const task = await scrumManager.getTask(taskId);
                if (task) {
                    const col = (await scrumManager.getProjectColumns(currentProjectId)).find(c => c.id === columnId);
                    if (col) {
                        chatManager.sendSystemMessage(currentProjectId, 
                            `📋 Tarefa "${task.title}" movida para "${col.title}"`);
                    }
                }
            } catch (err) {
                showNotification('Erro', err.message, 'error');
            }
        }
    });
}

async function openCustomizeBoard() {
    openModal('modal-customize-board');
    
    const columnList = document.getElementById('column-list');
    columnList.innerHTML = '';
    
    const columns = await scrumManager.getProjectColumns(currentProjectId);
    
    columns.forEach((col, index) => {
        const item = document.createElement('div');
        item.className = 'backlog-item';
        item.innerHTML = `
            <span style="color:${col.color}; font-size: 1.2rem;">⬤</span>
            <div class="backlog-item-info">
                <div class="backlog-item-title">${col.title}</div>
                <div class="backlog-item-meta">
                    <span>Limite WIP: ${col.wipLimit || 'Sem limite'}</span>
                </div>
            </div>
            <button class="btn-icon" onclick="deleteColumn('${col.id}')" title="Remover">🗑️</button>
        `;
        columnList.appendChild(item);
    });
    
    document.getElementById('btn-add-column').onclick = async () => {
        const title = prompt('Nome da nova coluna:');
        if (title) {
            await scrumManager.addCustomColumn(currentProjectId, title);
            await openCustomizeBoard();
        }
    };
    
    document.getElementById('btn-save-columns').onclick = async () => {
        closeModal('modal-customize-board');
        await renderBoard();
        showNotification('Quadro atualizado', 'As colunas foram salvas com sucesso', 'success');
    };
}

window.deleteColumn = async (columnId) => {
    if (confirm('Tem certeza que deseja remover esta coluna? As tarefas serão movidas.')) {
        await scrumManager.deleteColumn(columnId);
        await openCustomizeBoard();
    }
};

async function openTaskDetail(taskId) {
    const task = await scrumManager.getTask(taskId);
    if (!task) return;
    
    const body = document.getElementById('task-detail-body');
    const typeLabels = { task: 'Tarefa', bug: 'Bug', feature: 'Funcionalidade', improvement: 'Melhoria', epic: 'Épico' };
    
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
                    <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Crítica</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Alta</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Média</option>
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Baixa</option>
                    <option value="trivial" ${task.priority === 'trivial' ? 'selected' : ''}>Trivial</option>
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
            <label>Tipo: ${typeLabels[task.type] || task.type}</label>
        </div>
        <div class="form-group">
            <label>Story Points: ${task.storyPoints || 0}</label>
        </div>
        ${task.dueDate ? `<div class="form-group"><label>Prazo: ${formatDate(task.dueDate)}</label></div>` : ''}
        
        <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">
        
        <h4 style="margin: 0 0 12px;">Subtarefas</h4>
        <div id="detail-subtasks">
            ${task.subtasks && task.subtasks.length > 0 ? task.subtasks.map(st => `
                <div class="backlog-item" style="cursor: pointer;" onclick="toggleSubtask('${task.id}', '${st.id}')">
                    <span>${st.completed ? '✅' : '⬜'}</span>
                    <span style="${st.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(st.title)}</span>
                </div>
            `).join('') : '<p class="empty-state">Nenhuma subtarefa</p>'}
        </div>
        
        <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">
        
        <div class="form-row">
            <div class="form-group">
                <input type="text" id="new-subtask" placeholder="Nova subtarefa...">
            </div>
            <button class="btn-action" onclick="addSubtask('${task.id}')">+ Adicionar</button>
        </div>
        
        <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">
        
        <h4 style="margin: 0 0 12px;">Comentários</h4>
        <div id="detail-comments">
            ${task.comments && task.comments.length > 0 ? task.comments.map(c => `
                <div class="standup-entry">
                    <div class="standup-entry-header">
                        <strong>${escapeHtml(c.userName)}</strong>
                        <span class="standup-entry-date">${chatManager.formatTimestamp(c.timestamp)}</span>
                    </div>
                    <p class="standup-entry-text">${escapeHtml(c.text)}</p>
                </div>
            `).join('') : '<p class="empty-state">Nenhum comentário</p>'}
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <textarea id="new-comment" placeholder="Adicionar comentário..." rows="2"></textarea>
            </div>
            <button class="btn-action" onclick="addComment('${task.id}')">💬 Comentar</button>
        </div>
        
        <hr style="border-color: rgba(255,255,255,0.06); margin: 16px 0;">
        
        <div style="display: flex; gap: 10px;">
            <button class="btn-primary btn-full" onclick="saveTaskDetail('${task.id}')">💾 Salvar</button>
            <button class="btn-action btn-danger btn-full" onclick="deleteTaskConfirm('${task.id}')">🗑️ Excluir</button>
        </div>
    `;
    
    document.getElementById('task-detail-title').textContent = `📋 ${task.title}`;
    openModal('modal-task-detail');
}

window.saveTaskDetail = async (taskId) => {
    const updates = {
        title: document.getElementById('detail-title').value.trim(),
        description: document.getElementById('detail-description').value.trim(),
        priority: document.getElementById('detail-priority').value,
        status: document.getElementById('detail-status').value
    };
    
    try {
        await scrumManager.updateTask(taskId, updates);
        closeModal('modal-task-detail');
        await renderBoard();
        showNotification('Tarefa atualizada', 'As alterações foram salvas', 'success');
    } catch (err) {
        showNotification('Erro', err.message, 'error');
    }
};

window.deleteTaskConfirm = async (taskId) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        await scrumManager.deleteTask(taskId);
        closeModal('modal-task-detail');
        await renderBoard();
        showNotification('Tarefa excluída', 'A tarefa foi removida', 'success');
    }
};

window.toggleSubtask = async (taskId, subtaskId) => {
    await scrumManager.toggleSubtask(taskId, subtaskId);
    await openTaskDetail(taskId);
};

window.addSubtask = async (taskId) => {
    const input = document.getElementById('new-subtask');
    const title = input.value.trim();
    if (title) {
        await scrumManager.addTaskSubtask(taskId, title);
        input.value = '';
        await openTaskDetail(taskId);
    }
};

window.addComment = async (taskId) => {
    const text = document.getElementById('new-comment').value.trim();
    if (text) {
        await scrumManager.addTaskComment(taskId, currentUser.id, currentUser.name, text);
        document.getElementById('new-comment').value = '';
        
        // Notifica no chat
        const task = await scrumManager.getTask(taskId);
        chatManager.sendMessage(`💬 Novo comentário em "${task.title}": ${text}`, taskId);
        
        await openTaskDetail(taskId);
    }
};

// ==================== BACKLOG ====================
function setupBacklog() {
    document.getElementById('btn-add-backlog').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        
        const title = prompt('Título do item de backlog:');
        if (title && title.trim()) {
            const points = parseInt(prompt('Story Points (opcional):') || '0');
            await scrumManager.addToBacklog(currentProjectId, title.trim(), '', points);
            await renderBacklog();
            showNotification('Item adicionado', 'Adicionado ao backlog', 'success');
        }
    });
    
    document.getElementById('backlog-search').addEventListener('input', renderBacklog);
    document.getElementById('backlog-filter-priority').addEventListener('change', renderBacklog);
}

async function renderBacklog() {
    if (!currentProjectId) return;
    
    const search = document.getElementById('backlog-search').value.toLowerCase();
    const priorityFilter = document.getElementById('backlog-filter-priority').value;
    
    const items = await scrumManager.getProjectBacklog(currentProjectId);
    const list = document.getElementById('backlog-list');
    list.innerHTML = '';
    
    let filtered = items;
    if (search) filtered = filtered.filter(i => i.title.toLowerCase().includes(search));
    if (priorityFilter) filtered = filtered.filter(i => i.priority === priorityFilter);
    
    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhum item encontrado no backlog.</p>';
        return;
    }
    
    const priorityLabels = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa', trivial: 'Trivial' };
    
    for (const item of filtered.sort((a, b) => a.createdAt - b.createdAt)) {
        const el = document.createElement('div');
        el.className = 'backlog-item';
        el.innerHTML = `
            <span class="priority-indicator ${item.priority}"></span>
            <div class="backlog-item-info">
                <div class="backlog-item-title">${escapeHtml(item.title)}</div>
                <div class="backlog-item-meta">
                    <span>${priorityLabels[item.priority] || item.priority}</span>
                    ${item.storyPoints > 0 ? `<span>${item.storyPoints} pts</span>` : ''}
                    <span>${item.status}</span>
                </div>
            </div>
            <button class="btn-icon" onclick="moveBacklogToSprint('${item.id}')" title="Mover para Sprint">🏃</button>
            <button class="btn-icon" onclick="deleteBacklogItem('${item.id}')" title="Remover">🗑️</button>
        `;
        list.appendChild(el);
    }
}

window.moveBacklogToSprint = async (backlogId) => {
    const sprints = await scrumManager.getProjectSprints(currentProjectId);
    const activeSprint = sprints.find(s => s.status === 'active' || s.status === 'planning');
    
    if (activeSprint) {
        if (confirm(`Mover para sprint "${activeSprint.name}"?`)) {
            await scrumManager.moveBacklogToSprint(backlogId, activeSprint.id);
            await renderBacklog();
            await renderBoard();
            showNotification('Movido para sprint', `Item adicionado à ${activeSprint.name}`, 'success');
        }
    } else {
        showNotification('Atenção', 'Crie uma sprint ativa primeiro', 'warning');
    }
};

window.deleteBacklogItem = async (backlogId) => {
    if (confirm('Remover item do backlog?')) {
        await db.delete(STORES.BACKLOG, backlogId);
        await renderBacklog();
    }
};

// ==================== SPRINTS ====================
function setupSprints() {
    document.getElementById('btn-create-sprint').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        
        const project = await scrumManager.getProject(currentProjectId);
        const duration = project.settings.sprintDuration || 14;
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        
        const name = prompt('Nome da Sprint:', `Sprint ${(await scrumManager.getProjectSprints(currentProjectId)).length + 1}`);
        if (name && name.trim()) {
            const goal = prompt('Objetivo da Sprint (opcional):', '');
            await scrumManager.createSprint(
                currentProjectId,
                name.trim(),
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                goal || ''
            );
            await renderSprints();
            showNotification('Sprint criada', `"${name.trim()}" foi criada`, 'success');
        }
    });
    
    document.getElementById('btn-start-sprint').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const planning = sprints.find(s => s.status === 'planning');
        
        if (planning) {
            await scrumManager.startSprint(planning.id);
            await renderSprints();
            await renderBoard();
            showNotification('Sprint iniciada', `"${planning.name}" está em andamento`, 'success');
        } else {
            showNotification('Atenção', 'Nenhuma sprint em planejamento', 'warning');
        }
    });
    
    document.getElementById('btn-complete-sprint').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const active = sprints.find(s => s.status === 'active');
        
        if (active) {
            if (confirm(`Finalizar sprint "${active.name}"?`)) {
                await scrumManager.completeSprint(active.id);
                await renderSprints();
                await renderBoard();
                showNotification('Sprint finalizada', `"${active.name}" foi concluída`, 'success');
            }
        } else {
            showNotification('Atenção', 'Nenhuma sprint ativa', 'warning');
        }
    });
}

async function renderSprints() {
    if (!currentProjectId) return;
    
    const sprints = await scrumManager.getProjectSprints(currentProjectId);
    const list = document.getElementById('sprint-list');
    const detail = document.getElementById('sprint-detail');
    
    list.innerHTML = '';
    
    if (sprints.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma sprint criada.</p>';
        detail.innerHTML = '<p class="empty-state">Selecione uma sprint para ver detalhes</p>';
        return;
    }
    
    const statusLabels = { planning: '📋 Planejamento', active: '🏃 Ativa', completed: '✅ Concluída' };
    
    for (const sprint of sprints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
        const tasks = await scrumManager.getTasksBySprint(sprint.id);
        const completed = tasks.filter(t => t.completedAt).length;
        const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = `sprint-card${sprint.status === 'active' ? ' active' : ''}`;
        card.innerHTML = `
            <div class="sprint-name">${sprint.name}</div>
            <div class="sprint-dates">
                ${statusLabels[sprint.status]} | ${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}
                ${sprint.goal ? `<br>🎯 ${sprint.goal}` : ''}
            </div>
            <div class="sprint-progress">
                <div class="sprint-progress-bar" style="width: ${progress}%"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--muted); margin-top: 6px;">
                ${completed}/${tasks.length} tarefas (${progress}%)
            </div>
        `;
        
        card.addEventListener('click', async () => {
            document.querySelectorAll('.sprint-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const sprintTasks = tasks;
            detail.innerHTML = `
                <h3>${sprint.name} - Detalhes</h3>
                ${sprint.goal ? `<p style="color: var(--muted);">🎯 ${sprint.goal}</p>` : ''}
                <p><strong>${completed}/${sprintTasks.length}</strong> tarefas concluídas</p>
                
                <h4 style="margin-top: 16px;">Tarefas</h4>
                ${sprintTasks.length > 0 ? sprintTasks.map(t => `
                    <div class="backlog-item" onclick="openTaskDetail('${t.id}')">
                        <span class="priority-indicator ${t.priority}"></span>
                        <div class="backlog-item-info">
                            <div class="backlog-item-title">${escapeHtml(t.title)}</div>
                            <div class="backlog-item-meta">
                                <span>${t.assignedTo ? (await auth.getUserById(t.assignedTo)).name : 'Sem responsável'}</span>
                                <span>${t.completedAt ? '✅' : '⏳'}</span>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p class="empty-state">Nenhuma tarefa na sprint</p>'}
            `;
        });
        
        list.appendChild(card);
    }
}

// ==================== STANDUP ====================
function setupStandup() {
    document.getElementById('btn-submit-standup').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        
        const yesterday = document.getElementById('standup-yesterday').value.trim();
        const today = document.getElementById('standup-today').value.trim();
        const blockers = document.getElementById('standup-blockers').value.trim();
        
        if (!yesterday && !today) {
            showNotification('Atenção', 'Preencha pelo menos um campo (Ontem ou Hoje)', 'warning');
            return;
        }
        
        try {
            await scrumManager.createStandup(
                currentProjectId, 
                currentUser.id, 
                currentUser.name, 
                yesterday, 
                today, 
                blockers
            );
            
            document.getElementById('standup-yesterday').value = '';
            document.getElementById('standup-today').value = '';
            document.getElementById('standup-blockers').value = '';
            
            await renderStandups();
            showNotification('Standup enviado!', 'Registrado com sucesso', 'success');
        } catch (err) {
            console.error('Erro ao enviar standup:', err);
            showNotification('Erro', err.message || 'Não foi possível enviar o standup', 'error');
        }
    });
}

async function renderStandups() {
    if (!currentProjectId) return;
    
    const entries = document.getElementById('standup-entries');
    entries.innerHTML = '';
    
    try {
        const standups = await scrumManager.getTodayStandups(currentProjectId);
        
        if (standups.length === 0) {
            entries.innerHTML = '<p class="empty-state">Nenhum standup registrado hoje.</p>';
            return;
        }
        
        for (const s of standups) {
            const entry = document.createElement('div');
            entry.className = 'standup-entry';
            entry.innerHTML = `
                <div class="standup-entry-header">
                    <strong>${escapeHtml(s.userName)}</strong>
                    <span class="standup-entry-date">${s.date}</span>
                </div>
                ${s.yesterday ? `<p class="standup-entry-text"><strong>Ontem:</strong> ${escapeHtml(s.yesterday)}</p>` : ''}
                ${s.today ? `<p class="standup-entry-text"><strong>Hoje:</strong> ${escapeHtml(s.today)}</p>` : ''}
                ${s.blockers ? `<p class="standup-entry-text" style="color: #ef4444;"><strong>Impedimentos:</strong> ${escapeHtml(s.blockers)}</p>` : ''}
            `;
            entries.appendChild(entry);
        }
    } catch (err) {
        console.warn('Erro ao carregar standups:', err);
        entries.innerHTML = '<p class="empty-state">Erro ao carregar standups.</p>';
    }
}

// ==================== RETROSPECTIVA ====================
function setupRetrospective() {
    document.getElementById('btn-save-retro').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        
        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const completed = sprints.find(s => s.status === 'completed');
        
        if (!completed) {
            showNotification('Atenção', 'Complete uma sprint primeiro', 'warning');
            return;
        }
        
        // Coleta itens das colunas
        const goodItems = Array.from(document.querySelectorAll('#retro-good .retro-item')).map(el => ({
            text: el.textContent.replace('🗑️', '').trim(),
            votes: 0
        }));
        
        const improveItems = Array.from(document.querySelectorAll('#retro-improve .retro-item')).map(el => ({
            text: el.textContent.replace('🗑️', '').trim(),
            votes: 0
        }));
        
        const actionItems = Array.from(document.querySelectorAll('#retro-actions .retro-item')).map(el => ({
            text: el.textContent.replace('🗑️', '').trim(),
            votes: 0
        }));
        
        if (goodItems.length === 0 && improveItems.length === 0 && actionItems.length === 0) {
            showNotification('Atenção', 'Adicione pelo menos um item antes de salvar', 'warning');
            return;
        }
        
        try {
            await scrumManager.createRetrospective(currentProjectId, completed.id, {
                wentWell: goodItems,
                toImprove: improveItems,
                actionItems: actionItems
            });
            
            showNotification('Retrospectiva salva!', 'Os dados foram registrados', 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
    
    // Adicionar itens nas colunas
    document.querySelectorAll('.btn-add-retro-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            const text = prompt('Adicionar item:');
            if (text && text.trim()) {
                const item = document.createElement('div');
                item.className = 'retro-item';
                item.innerHTML = `
                    <span>${escapeHtml(text.trim())}</span>
                    <button class="btn-icon" onclick="this.parentElement.remove()" style="margin-left: auto;">🗑️</button>
                `;
                
                const targetMap = {
                    wentWell: 'retro-good',
                    toImprove: 'retro-improve',
                    actionItems: 'retro-actions'
                };
                
                document.getElementById(targetMap[section]).appendChild(item);
            }
        });
    });
}

// ==================== LEMBRETES ====================
function setupReminders() {
    document.getElementById('btn-add-reminder').addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Atenção', 'Faça login primeiro', 'warning');
            return;
        }
        openModal('modal-reminder');
    });
    
    document.getElementById('reminder-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titleInput = document.getElementById('reminder-title');
        const dueInput = document.getElementById('reminder-due');
        
        if (!titleInput.value.trim()) {
            showNotification('Atenção', 'O título do lembrete é obrigatório', 'warning');
            titleInput.focus();
            return;
        }
        
        if (!dueInput.value) {
            showNotification('Atenção', 'A data/hora do lembrete é obrigatória', 'warning');
            dueInput.focus();
            return;
        }
        
        const data = {
            userId: currentUser.id,
            title: titleInput.value.trim(),
            description: document.getElementById('reminder-description').value.trim(),
            dueDate: dueInput.value,
            remindBefore: parseInt(document.getElementById('reminder-before').value),
            priority: document.getElementById('reminder-priority').value,
            repeat: document.getElementById('reminder-repeat').value
        };
        
        try {
            await reminderManager.createReminder(data);
            closeModal('modal-reminder');
            document.getElementById('reminder-form').reset();
            await renderReminders();
            showNotification('Lembrete criado', `"${data.title}" será lembrado`, 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderReminders();
        });
    });
}

async function renderReminders() {
    if (!currentUser) return;
    
    const list = document.getElementById('reminder-list');
    const activeFilter = document.querySelector('.filter-btn.active');
    const filter = activeFilter ? activeFilter.dataset.filter : 'all';
    
    let reminders = [];
    
    switch (filter) {
        case 'pending':
            reminders = await reminderManager.getActiveReminders(currentUser.id);
            break;
        case 'overdue':
            reminders = await reminderManager.getOverdueReminders(currentUser.id);
            break;
        case 'upcoming':
            reminders = await reminderManager.getUpcomingReminders(currentUser.id, 7);
            break;
        default:
            reminders = await reminderManager.getUserReminders(currentUser.id);
    }
    
    list.innerHTML = '';
    
    if (reminders.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhum lembrete encontrado.</p>';
        return;
    }
    
    for (const rem of reminders) {
        const isOverdue = new Date(rem.dueDate) < new Date();
        
        const card = document.createElement('div');
        card.className = `reminder-card${isOverdue ? ' overdue' : ''}`;
        card.innerHTML = `
            <span style="font-size: 1.2rem;">${isOverdue ? '🚨' : '⏰'}</span>
            <div class="reminder-info">
                <div class="reminder-title">${escapeHtml(rem.title)}</div>
                <div class="reminder-meta">
                    ${reminderManager.formatDueDate(rem.dueDate)}
                    ${rem.description ? `| ${escapeHtml(rem.description)}` : ''}
                    ${rem.repeat !== 'none' ? `| 🔄 ${rem.repeat}` : ''}
                </div>
            </div>
            <button class="reminder-toggle" onclick="toggleReminder('${rem.id}')" title="${rem.active ? 'Desativar' : 'Ativar'}">
                ${rem.active ? '🔔' : '🔕'}
            </button>
            <button class="reminder-toggle" onclick="deleteReminder('${rem.id}')" title="Excluir">🗑️</button>
        `;
        list.appendChild(card);
    }
}

window.toggleReminder = async (reminderId) => {
    await reminderManager.toggleReminder(reminderId);
    await renderReminders();
};

window.deleteReminder = async (reminderId) => {
    if (confirm('Excluir este lembrete?')) {
        await reminderManager.deleteReminder(reminderId);
        await renderReminders();
    }
};

// ==================== ESTATÍSTICAS ====================
function setupStats() {
    document.getElementById('btn-refresh-stats').addEventListener('click', renderStats);
}

async function renderStats() {
    if (!currentProjectId) return;
    
    try {
        const stats = await scrumManager.getProjectStats(currentProjectId);
        
        document.getElementById('stat-total').textContent = stats.totalTasks;
        document.getElementById('stat-completed').textContent = stats.completedTasks;
        document.getElementById('stat-in-progress').textContent = stats.inProgress;
        document.getElementById('stat-overdue').textContent = stats.overdue;
        document.getElementById('stat-points').textContent = stats.completedStoryPoints;
        
        // Velocidade
        const velocity = await scrumManager.getVelocity(currentProjectId);
        const avgVelocity = velocity.length > 0 
            ? Math.round(velocity.reduce((s, v) => s + v.completedPoints, 0) / velocity.length)
            : 0;
        document.getElementById('stat-velocity').textContent = avgVelocity;
        
        // Burn down chart
        const activeSprint = await scrumManager.getActiveSprint(currentProjectId);
        if (activeSprint) {
            await renderBurndownChart(activeSprint.id);
        }
    } catch (err) {
        console.warn('Erro ao carregar estatísticas:', err);
    }
}

async function renderBurndownChart(sprintId) {
    const canvas = document.getElementById('burndown-chart');
    const ctx = canvas.getContext('2d');
    
    if (window.burndownChart) {
        window.burndownChart.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    const data = await scrumManager.getSprintBurndown(sprintId);
    if (!data || data.length === 0) return;
    
    const width = canvas.parentElement.clientWidth - 40;
    const height = 250;
    canvas.width = width;
    canvas.height = height;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const maxPoints = Math.max(...data.map(d => Math.max(d.ideal, d.actual)), 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        ctx.fillStyle = '#9aa4b2';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxPoints - (maxPoints / 4) * i), padding - 8, y + 3);
    }
    
    // Linha ideal
    ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = padding + chartHeight - (d.ideal / maxPoints) * chartHeight;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Linha real
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = padding + chartHeight - (d.actual / maxPoints) * chartHeight;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Pontos
    data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = padding + chartHeight - (d.actual / maxPoints) * chartHeight;
        
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Labels
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    
    const steps = Math.min(data.length, 7);
    const stepInterval = Math.floor(data.length / steps);
    for (let i = 0; i < data.length; i += stepInterval) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        ctx.fillText(data[i].date.slice(-2), x, height - 4);
    }
    
    // Legenda
    ctx.fillStyle = 'rgba(107, 114, 128, 0.5)';
    ctx.fillRect(width - 140, 10, 12, 3);
    ctx.fillStyle = '#9aa4b2';
    ctx.textAlign = 'left';
    ctx.fillText('Ideal', width - 124, 14);
    
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width - 140, 24);
    ctx.lineTo(width - 128, 24);
    ctx.stroke();
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText('Real', width - 124, 28);
    
    window.burndownChart = ctx;
}

// ==================== CHAT ====================
function setupChat() {
    document.getElementById('btn-send-chat').addEventListener('click', sendChatMessage);
    
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    // Escuta novas mensagens
    chatManager.onMessage((message) => {
        const container = document.getElementById('chat-messages');
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        container.appendChild(chatManager.renderMessage(message));
        container.scrollTop = container.scrollHeight;
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text || !currentProjectId) return;
    
    try {
        await chatManager.sendMessage(text);
        input.value = '';
    } catch (err) {
        showNotification('Erro', 'Não foi possível enviar a mensagem', 'error');
    }
}

async function loadChat() {
    if (!currentProjectId) return;
    
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    const messages = await chatManager.getMessages(50);
    
    if (messages.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma mensagem ainda. Envie a primeira!</p>';
        return;
    }
    
    for (const msg of messages) {
        container.appendChild(chatManager.renderMessage(msg));
    }
    
    container.scrollTop = container.scrollHeight;
}

// ==================== MEMBROS ====================
function setupMembers() {
    document.getElementById('btn-add-member').addEventListener('click', async () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        
        const select = document.getElementById('member-select');
        select.innerHTML = '<option value="">Selecione...</option>';
        
        try {
            const users = await auth.getAllUsers();
            const project = await scrumManager.getProject(currentProjectId);
            
            if (project && project.memberIds) {
                for (const user of users) {
                    if (!project.memberIds.includes(user.id)) {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = `${user.name} (${user.email})`;
                        select.appendChild(option);
                    }
                }
            }
            
            openModal('modal-member');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
    
    document.getElementById('btn-add-member-confirm').addEventListener('click', async () => {
        const userId = document.getElementById('member-select').value;
        if (userId) {
            await scrumManager.addProjectMember(currentProjectId, userId);
            closeModal('modal-member');
            await renderMembers();
            showNotification('Membro adicionado', 'Usuário adicionado ao projeto', 'success');
        } else {
            showNotification('Atenção', 'Selecione um usuário', 'warning');
        }
    });
}

async function renderMembers() {
    if (!currentProjectId) return;
    
    const container = document.getElementById('members-container');
    container.innerHTML = '';
    
    try {
        const project = await scrumManager.getProject(currentProjectId);
        
        if (!project || !project.memberIds || project.memberIds.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum membro no projeto.</p>';
            return;
        }
        
        const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];
        
        for (const memberId of project.memberIds) {
            const user = await auth.getUserById(memberId);
            if (!user) continue;
            
            const colorIndex = project.memberIds.indexOf(memberId) % colors.length;
            const isOwner = memberId === project.ownerId;
            
            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                <div class="member-avatar" style="background: ${colors[colorIndex]}">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="member-info">
                    <div class="member-name">${escapeHtml(user.name)}</div>
                    <div class="member-email">${escapeHtml(user.email)}</div>
                </div>
                <span class="member-role">${isOwner ? '👑 Proprietário' : '👤 Membro'}</span>
                ${!isOwner ? `<button class="member-remove" onclick="removeMember('${memberId}')">Remover</button>` : ''}
            `;
            container.appendChild(card);
        }
    } catch (err) {
        console.warn('Erro ao carregar membros:', err);
        container.innerHTML = '<p class="empty-state">Erro ao carregar membros.</p>';
    }
}

window.removeMember = async (userId) => {
    if (confirm('Remover este membro do projeto?')) {
        await scrumManager.removeProjectMember(currentProjectId, userId);
        await renderMembers();
        showNotification('Membro removido', 'Usuário removido do projeto', 'success');
    }
};

// ==================== CONFIGURAÇÕES ====================
function setupSettings() {
    // Carrega configurações do usuário
    if (currentUser) {
        document.getElementById('settings-name').value = currentUser.name || '';
        document.getElementById('settings-email').value = currentUser.email || '';
        document.getElementById('settings-notifications').checked = currentUser.preferences?.notifications ?? true;
        document.getElementById('settings-sound').checked = true;
    }
    
    // Salvar configurações
    document.getElementById('btn-save-settings').addEventListener('click', async () => {
        const updates = {
            name: document.getElementById('settings-name').value.trim(),
            email: document.getElementById('settings-email').value.trim(),
            preferences: {
                theme: 'dark',
                notifications: document.getElementById('settings-notifications').checked,
                emailReminders: false
            }
        };
        
        try {
            await auth.updateProfile(updates);
            setupUserProfile(); // Atualiza sidebar
            showNotification('Configurações salvas', 'Suas preferências foram atualizadas', 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
    
    // Exportar dados
    document.getElementById('btn-export-data').addEventListener('click', async () => {
        const exportData = {};
        for (const store of Object.values(STORES)) {
            exportData[store] = await db.getAll(store);
        }
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Dados exportados', 'Backup realizado com sucesso', 'success');
    });
    
    // Importar dados
    document.getElementById('btn-import-data').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                for (const [store, items] of Object.entries(data)) {
                    if (Array.isArray(items) && Object.values(STORES).includes(store)) {
                        await db.clear(store);
                        for (const item of items) {
                            await db.add(store, item);
                        }
                    }
                }
                
                showNotification('Dados importados', 'Restauração concluída. Recarregue a página.', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                showNotification('Erro', 'Arquivo inválido', 'error');
            }
        };
        
        input.click();
    });
    
    // Limpar dados
    document.getElementById('btn-clear-data').addEventListener('click', async () => {
        if (confirm('Tem certeza? Todos os dados serão perdidos!') && 
            confirm('Esta ação não pode ser desfeita. Continuar?')) {
            
            for (const store of Object.values(STORES)) {
                await db.clear(store);
            }
            
            localStorage.clear();
            showNotification('Dados limpos', 'Todos os dados foram removidos', 'success');
            setTimeout(() => window.location.reload(), 2000);
        }
    });
}

// ==================== NOTIFICAÇÕES ====================
function setupNotifications() {
    // Escuta notificações de lembretes
    window.addEventListener('reminder:show', (e) => {
        const { title, body, urgent } = e.detail;
        showNotification(title, body, urgent ? 'urgent' : 'reminder');
    });
    
    // Escuta mudanças de autenticação
    window.addEventListener('auth:change', (e) => {
        if (!e.detail.user) {
            window.location.href = 'login.html';
        }
    });
}

function showNotification(title, body, type = 'info') {
    const container = document.getElementById('notification-container');
    
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        reminder: '⏰',
        urgent: '🚨',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(title)}</div>
            ${body ? `<div class="notification-body">${escapeHtml(body)}</div>` : ''}
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== EVENTOS GLOBAIS ====================
function setupEventListeners() {
    // Atualiza quadro quando tarefa é alterada
    window.addEventListener('task:update', async () => {
        await renderBoard();
    });
    
    window.addEventListener('task:delete', async () => {
        await renderBoard();
    });
    
    // Redimensionamento do canvas do burndown
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('burndown-chart');
        if (canvas && canvas.width > 0) {
            const activeSprint = scrumManager.getActiveSprint(currentProjectId);
            if (activeSprint) {
                renderBurndownChart(activeSprint.id);
            }
        }
    });
}

// ==================== UTILITÁRIOS ====================
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