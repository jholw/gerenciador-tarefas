/**
 * main.js - Controlador principal (ORQUESTRADOR)
 * Versão refatorada: ~380 linhas
 * Integra os módulos: auth, scrum, kanban, chat, reminders
 */

// ==================== ESTADO GLOBAL ====================
let currentProjectId = null;
let currentUser = null;

// ==================== INICIALIZAÇÃO PRINCIPAL ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.open();
        await auth.init();

        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = auth.getCurrentUser();

        await reminderManager.init();

        setupUserProfile();
        setupNavigation();
        setupProjectSelector();
        setupModals();
        setupBoardEvents();
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
        showSectionIntros(false);

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

function showSectionIntros(hasProject) {
    const sections = ['backlog', 'sprints', 'standup', 'retro', 'stats', 'chat', 'members'];
    sections.forEach(id => {
        const intro = document.getElementById(`${id}-intro`);
        if (intro) {
            intro.classList.toggle('visible', !hasProject);
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
        currentProjectId = select.value || null;
        if (currentProjectId) {
            await loadProjectData();
            await selectProject(currentProjectId);
            showWelcomeDashboard(false);
            showSectionIntros(true);
        } else {
            showWelcomeDashboard(true);
            showSectionIntros(false);
            clearAllViews();
        }
    });

    document.getElementById('btn-new-project').addEventListener('click', () => {
        openModal('modal-project');
    });

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

function clearAllViews() {
    document.getElementById('board-grid').innerHTML = '';
    document.getElementById('backlog-list').innerHTML = '<p class="empty-state">Selecione um projeto para ver o backlog.</p>';
    document.getElementById('sprint-list').innerHTML = '';
    document.getElementById('standup-entries').innerHTML = '';
    document.getElementById('members-container').innerHTML = '<p class="empty-state">Selecione um projeto para ver os membros.</p>';
    document.getElementById('chat-messages').innerHTML = '<p class="empty-state">Selecione um projeto para acessar o chat.</p>';
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

    if (projects.length === 0) {
        showWelcomeDashboard(true);
        showSectionIntros(false);
    }
}

async function selectProject(projectId) {
    currentProjectId = projectId;
    kanbanBoard.init(projectId);

    await chatManager.init(projectId, currentUser.id, currentUser.name);

    await kanbanBoard.render();
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

// ==================== QUADRO KANBAN (EVENTOS) ====================
function setupBoardEvents() {
    document.getElementById('btn-add-task').addEventListener('click', () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        kanbanBoard.populateTaskForm();
        openModal('modal-task');
    });

    document.getElementById('btn-customize-board').addEventListener('click', () => {
        if (!currentProjectId) {
            showNotification('Atenção', 'Selecione um projeto primeiro', 'warning');
            return;
        }
        kanbanBoard.openCustomize();
    });

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
            await kanbanBoard.render();
            showNotification('Tarefa criada', `"${taskData.title}" foi adicionada ao quadro`, 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });
}

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

    document.getElementById('backlog-search').addEventListener('input', debounce(renderBacklog, 300));
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

    for (const item of filtered.sort((a, b) => a.createdAt - b.createdAt)) {
        const el = document.createElement('div');
        el.className = 'backlog-item';
        el.innerHTML = `
            <span class="priority-indicator ${item.priority}"></span>
            <div class="backlog-item-info">
                <div class="backlog-item-title">${escapeHtml(item.title)}</div>
                <div class="backlog-item-meta">
                    <span>${PRIORITY_LABELS[item.priority] || item.priority}</span>
                    ${item.storyPoints > 0 ? `<span>${item.storyPoints} pts</span>` : ''}
                    <span>${item.status}</span>
                </div>
            </div>
            <button class="btn-icon" data-action="move-to-sprint" data-id="${item.id}" title="Mover para Sprint">🏃</button>
            <button class="btn-icon" data-action="delete-backlog" data-id="${item.id}" title="Remover">🗑️</button>
        `;

        // Event listeners via delegation
        el.querySelector('[data-action="move-to-sprint"]').addEventListener('click', async () => {
            await moveBacklogToSprint(item.id);
        });
        el.querySelector('[data-action="delete-backlog"]').addEventListener('click', async () => {
            if (confirm('Remover item do backlog?')) {
                await db.delete(STORES.BACKLOG, item.id);
                await renderBacklog();
            }
        });

        list.appendChild(el);
    }
}

async function moveBacklogToSprint(backlogId) {
    const sprints = await scrumManager.getProjectSprints(currentProjectId);
    const activeSprint = sprints.find(s => s.status === 'active' || s.status === 'planning');

    if (activeSprint) {
        if (confirm(`Mover para sprint "${activeSprint.name}"?`)) {
            await scrumManager.moveBacklogToSprint(backlogId, activeSprint.id);
            await renderBacklog();
            await kanbanBoard.render();
            showNotification('Movido para sprint', `Item adicionado à ${activeSprint.name}`, 'success');
        }
    } else {
        showNotification('Atenção', 'Crie uma sprint ativa primeiro', 'warning');
    }
}

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

        const sprintCount = (await scrumManager.getProjectSprints(currentProjectId)).length;
        const name = prompt('Nome da Sprint:', `Sprint ${sprintCount + 1}`);
        if (name && name.trim()) {
            const goal = prompt('Objetivo da Sprint (opcional):', '');
            await scrumManager.createSprint(
                currentProjectId, name.trim(),
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                goal || ''
            );
            await renderSprints();
            showNotification('Sprint criada', `"${name.trim()}" foi criada`, 'success');
        }
    });

    document.getElementById('btn-start-sprint').addEventListener('click', async () => {
        if (!currentProjectId) { showNotification('Atenção', 'Selecione um projeto primeiro', 'warning'); return; }
        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const planning = sprints.find(s => s.status === 'planning');
        if (planning) {
            await scrumManager.startSprint(planning.id);
            await renderSprints();
            await kanbanBoard.render();
            showNotification('Sprint iniciada', `"${planning.name}" está em andamento`, 'success');
        } else {
            showNotification('Atenção', 'Nenhuma sprint em planejamento', 'warning');
        }
    });

    document.getElementById('btn-complete-sprint').addEventListener('click', async () => {
        if (!currentProjectId) { showNotification('Atenção', 'Selecione um projeto primeiro', 'warning'); return; }
        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const active = sprints.find(s => s.status === 'active');
        if (active) {
            if (confirm(`Finalizar sprint "${active.name}"?`)) {
                await scrumManager.completeSprint(active.id);
                await renderSprints();
                await kanbanBoard.render();
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

    // Ordena por data de criação (mais recente primeiro)
    const sorted = [...sprints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    for (const sprint of sorted) {
        const tasks = await scrumManager.getTasksBySprint(sprint.id);
        const completed = tasks.filter(t => t.completedAt).length;
        const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        const card = document.createElement('div');
        card.className = `sprint-card${sprint.status === 'active' ? ' active' : ''}`;
        card.innerHTML = `
            <div class="sprint-name">${escapeHtml(sprint.name)}</div>
            <div class="sprint-dates">
                ${STATUS_LABELS[sprint.status] || sprint.status} | ${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}
                ${sprint.goal ? `<br>🎯 ${escapeHtml(sprint.goal)}` : ''}
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
            await showSprintDetail(sprint, tasks, completed);
        });

        list.appendChild(card);
    }
}

async function showSprintDetail(sprint, tasks, completed) {
    const detail = document.getElementById('sprint-detail');

    // CORREÇÃO: usa for loop em vez de async dentro de map
    let taskHtml = '';
    if (tasks.length > 0) {
        for (const t of tasks) {
            let assigneeName = 'Sem responsável';
            if (t.assignedTo) {
                const user = await auth.getUserById(t.assignedTo);
                if (user) assigneeName = user.name;
            }
            taskHtml += `
                <div class="backlog-item" style="cursor: pointer;" data-task-id="${t.id}">
                    <span class="priority-indicator ${t.priority}"></span>
                    <div class="backlog-item-info">
                        <div class="backlog-item-title">${escapeHtml(t.title)}</div>
                        <div class="backlog-item-meta">
                            <span>${escapeHtml(assigneeName)}</span>
                            <span>${t.completedAt ? '✅' : '⏳'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        taskHtml = '<p class="empty-state">Nenhuma tarefa na sprint</p>';
    }

    detail.innerHTML = `
        <h3>${escapeHtml(sprint.name)} - Detalhes</h3>
        ${sprint.goal ? `<p style="color: var(--muted);">🎯 ${escapeHtml(sprint.goal)}</p>` : ''}
        <p><strong>${completed}/${tasks.length}</strong> tarefas concluídas</p>
        <h4 style="margin-top: 16px;">Tarefas</h4>
        ${taskHtml}
    `;

    // Adiciona event listeners para abrir detalhes da tarefa
    detail.querySelectorAll('[data-task-id]').forEach(el => {
        el.addEventListener('click', () => {
            kanbanBoard.openTaskDetail(el.dataset.taskId);
        });
    });
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
            await scrumManager.createStandup(currentProjectId, currentUser.id, currentUser.name, yesterday, today, blockers);
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
        if (!currentProjectId) { showNotification('Atenção', 'Selecione um projeto primeiro', 'warning'); return; }

        const sprints = await scrumManager.getProjectSprints(currentProjectId);
        const completed = sprints.find(s => s.status === 'completed');

        if (!completed) {
            showNotification('Atenção', 'Complete uma sprint primeiro', 'warning');
            return;
        }

        const collectItems = (id) => Array.from(document.querySelectorAll(`#${id} .retro-item`))
            .map(el => ({ text: el.textContent.replace('🗑️', '').trim(), votes: 0 }))
            .filter(item => item.text);

        const goodItems = collectItems('retro-good');
        const improveItems = collectItems('retro-improve');
        const actionItems = collectItems('retro-actions');

        if (goodItems.length === 0 && improveItems.length === 0 && actionItems.length === 0) {
            showNotification('Atenção', 'Adicione pelo menos um item antes de salvar', 'warning');
            return;
        }

        try {
            await scrumManager.createRetrospective(currentProjectId, completed.id, {
                wentWell: goodItems, toImprove: improveItems, actionItems: actionItems
            });
            showNotification('Retrospectiva salva!', 'Os dados foram registrados', 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });

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
                const map = { wentWell: 'retro-good', toImprove: 'retro-improve', actionItems: 'retro-actions' };
                document.getElementById(map[section]).appendChild(item);
            }
        });
    });
}

// ==================== LEMBRETES ====================
function setupReminders() {
    document.getElementById('btn-add-reminder').addEventListener('click', () => {
        if (!currentUser) { showNotification('Atenção', 'Faça login primeiro', 'warning'); return; }
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

        try {
            await reminderManager.createReminder({
                userId: currentUser.id,
                title: titleInput.value.trim(),
                description: document.getElementById('reminder-description').value.trim(),
                dueDate: dueInput.value,
                remindBefore: parseInt(document.getElementById('reminder-before').value),
                priority: document.getElementById('reminder-priority').value,
                repeat: document.getElementById('reminder-repeat').value
            });
            closeModal('modal-reminder');
            document.getElementById('reminder-form').reset();
            await renderReminders();
            showNotification('Lembrete criado', 'O lembrete foi agendado', 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });

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
        case 'pending': reminders = await reminderManager.getActiveReminders(currentUser.id); break;
        case 'overdue': reminders = await reminderManager.getOverdueReminders(currentUser.id); break;
        case 'upcoming': reminders = await reminderManager.getUpcomingReminders(currentUser.id, 7); break;
        default: reminders = await reminderManager.getUserReminders(currentUser.id);
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
            <button class="reminder-toggle" data-action="toggle-reminder" data-id="${rem.id}" title="${rem.active ? 'Desativar' : 'Ativar'}">
                ${rem.active ? '🔔' : '🔕'}
            </button>
            <button class="reminder-toggle" data-action="delete-reminder" data-id="${rem.id}" title="Excluir">🗑️</button>
        `;

        card.querySelector('[data-action="toggle-reminder"]').addEventListener('click', async () => {
            await reminderManager.toggleReminder(rem.id);
            await renderReminders();
        });
        card.querySelector('[data-action="delete-reminder"]').addEventListener('click', async () => {
            if (confirm('Excluir este lembrete?')) {
                await reminderManager.deleteReminder(rem.id);
                await renderReminders();
            }
        });

        list.appendChild(card);
    }
}

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

        const velocity = await scrumManager.getVelocity(currentProjectId);
        const avgVelocity = velocity.length > 0
            ? Math.round(velocity.reduce((s, v) => s + v.completedPoints, 0) / velocity.length)
            : 0;
        document.getElementById('stat-velocity').textContent = avgVelocity;

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

    // Ideal line
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

    // Actual line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const y = padding + chartHeight - (d.actual / maxPoints) * chartHeight;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
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

    // Legend
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
        if (!currentProjectId) { showNotification('Atenção', 'Selecione um projeto primeiro', 'warning'); return; }

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

        for (const memberId of project.memberIds) {
            const user = await auth.getUserById(memberId);
            if (!user) continue;

            const colorIndex = project.memberIds.indexOf(memberId) % MEMBER_COLORS.length;
            const isOwner = memberId === project.ownerId;

            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                <div class="member-avatar" style="background: ${MEMBER_COLORS[colorIndex]}">${user.name.charAt(0).toUpperCase()}</div>
                <div class="member-info">
                    <div class="member-name">${escapeHtml(user.name)}</div>
                    <div class="member-email">${escapeHtml(user.email)}</div>
                </div>
                <span class="member-role">${isOwner ? '👑 Proprietário' : '👤 Membro'}</span>
                ${!isOwner ? `<button class="member-remove" data-action="remove-member" data-id="${memberId}">Remover</button>` : ''}
            `;

            const removeBtn = card.querySelector('[data-action="remove-member"]');
            if (removeBtn) {
                removeBtn.addEventListener('click', async () => {
                    if (confirm('Remover este membro do projeto?')) {
                        await scrumManager.removeProjectMember(currentProjectId, memberId);
                        await renderMembers();
                        showNotification('Membro removido', 'Usuário removido do projeto', 'success');
                    }
                });
            }

            container.appendChild(card);
        }
    } catch (err) {
        console.warn('Erro ao carregar membros:', err);
        container.innerHTML = '<p class="empty-state">Erro ao carregar membros.</p>';
    }
}

// ==================== CONFIGURAÇÕES ====================
function setupSettings() {
    if (currentUser) {
        document.getElementById('settings-name').value = currentUser.name || '';
        document.getElementById('settings-email').value = currentUser.email || '';
        document.getElementById('settings-notifications').checked = currentUser.preferences?.notifications ?? true;
        document.getElementById('settings-sound').checked = true;
    }

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
            setupUserProfile();
            showNotification('Configurações salvas', 'Suas preferências foram atualizadas', 'success');
        } catch (err) {
            showNotification('Erro', err.message, 'error');
        }
    });

    document.getElementById('btn-export-data').addEventListener('click', async () => {
        const exportData = {};
        for (const store of Object.values(STORES)) {
            exportData[store] = await db.getAll(store);
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${todayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Dados exportados', 'Backup realizado com sucesso', 'success');
    });

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
    window.addEventListener('reminder:show', (e) => {
        const { title, body, urgent } = e.detail;
        showNotification(title, body, urgent ? 'urgent' : 'reminder');
    });

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

    toast.innerHTML = `
        <span class="notification-icon">${NOTIFICATION_ICONS[type] || 'ℹ️'}</span>
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
    window.addEventListener('task:update', async () => {
        await kanbanBoard.render();
    });

    window.addEventListener('task:delete', async () => {
        await kanbanBoard.render();
    });

    window.addEventListener('resize', () => {
        const canvas = document.getElementById('burndown-chart');
        if (canvas && canvas.width > 0) {
            scrumManager.getActiveSprint(currentProjectId).then(sprint => {
                if (sprint) renderBurndownChart(sprint.id);
            }).catch(() => {});
        }
    });
}