// main.js
// Este script controla o comportamento do gerenciador de tarefas todos os dias.
// Ele cria tarefas, renderiza o quadro e suporta arrastar/soltar e salvar observações.
const STORAGE_KEY = 'dailyTaskGeneratorState';
const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const state = { tasks: [], completed: [] };
const dropZones = ['high-column', 'medium-column', 'low-column', 'completed-tasks'];

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário e botão de adicionar tarefa.
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-description');
    const urgencyInput = document.getElementById('task-urgency');
    const importanceInput = document.getElementById('task-importance');
    const addTaskButton = document.getElementById('add-task-btn');

    // Ao clicar no botão ou pressionar Enter, cria uma nova tarefa.
    addTaskButton.addEventListener('click', () => handleAddTask(titleInput, descInput, urgencyInput, importanceInput));
    titleInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddTask(titleInput, descInput, urgencyInput, importanceInput);
        }
    });

    setupDropZones();
    loadState();
    renderBoard();
});

// Cria uma nova tarefa a partir dos valores do formulário.
function handleAddTask(titleInput, descInput, urgencyInput, importanceInput) {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const urgency = urgencyInput.value;
    const importance = importanceInput.value;

    if (!title) {
        showMessage('Por favor, informe o título da tarefa.');
        return;
    }

    const task = {
        id: Date.now().toString(),
        title,
        description: description || 'Sem descrição',
        urgency,
        importance,
        solution: '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    state.tasks.unshift(task); // Adiciona a tarefa no início da lista.
    saveState(); // Salva o estado atual no armazenamento local.
    renderBoard(); // Atualiza a exibição do quadro.

    // Limpa o formulário e devolve o foco ao campo de título.
    titleInput.value = '';
    descInput.value = '';
    urgencyInput.value = 'high';
    importanceInput.value = 'high';
    titleInput.focus();
}

// Renderiza todas as colunas de tarefas e a área de concluídas.
function renderBoard() {
    renderColumn('high');
    renderColumn('medium');
    renderColumn('low');
    renderCompleted();
}

// Renderiza apenas as tarefas de uma prioridade específica.
function renderColumn(priority) {
    const column = document.getElementById(`${priority}-column`);
    const filteredTasks = state.tasks.filter(task => task.urgency === priority && !task.completed);

    column.innerHTML = '';

    if (filteredTasks.length === 0) {
        column.innerHTML = `<p class="empty-state">Nenhuma tarefa ${priorityLabels[priority].toLowerCase()} por enquanto.</p>`;
        return;
    }

    filteredTasks.forEach(task => {
        column.appendChild(createTaskCard(task));
    });
}

// Renderiza a lista de tarefas concluídas separadamente.
function renderCompleted() {
    const completedColumn = document.getElementById('completed-tasks');
    const completedTasks = state.completed;

    completedColumn.innerHTML = '';

    if (completedTasks.length === 0) {
        completedColumn.innerHTML = '<p class="empty-state">Nenhuma tarefa concluída ainda.</p>';
        return;
    }

    completedTasks.forEach(task => {
        completedColumn.appendChild(createTaskCard(task, true));
    });
}

// Cria o elemento visual de cada tarefa.
function createTaskCard(task, completed = false) {
    const card = document.createElement('article');
    card.className = `task-card ${task.urgency}`;
    card.setAttribute('draggable', 'true');
    card.dataset.taskId = task.id;

    const statusText = completed ? 'Concluída' : 'Em andamento';
    const statusClass = completed ? 'completed' : task.urgency;

    card.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="tag-urgency ${task.urgency}">${priorityLabels[task.urgency]}</span>
        </div>
        <p class="task-desc">${task.description}</p>
        <div class="task-meta">
            <span>Importância: <strong>${task.importance}</strong></span>
            <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
        <div class="task-solution-panel">
            <label for="solution-${task.id}">Solução / Observação</label>
            <textarea id="solution-${task.id}" class="solution-input" placeholder="Descreva o que foi feito ou problemas encontrados...">${task.solution || ''}</textarea>
            <button class="save-solution-btn">Salvar observação</button>
        </div>
        <div class="task-footer">
            <button class="action-btn">${completed ? 'Reabrir' : 'Concluir'}</button>
        </div>
    `;

    card.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    const actionButton = card.querySelector('.action-btn');
    actionButton.addEventListener('click', () => toggleTaskStatus(task.id, completed));

    const saveButton = card.querySelector('.save-solution-btn');
    const solutionInput = card.querySelector('.solution-input');
    if (saveButton && solutionInput) {
        saveButton.addEventListener('click', event => {
            event.preventDefault();
            updateTaskSolution(task.id, solutionInput.value.trim());
        });
    }

    return card;
}

// Atualiza a solução/observação de uma tarefa e salva no estado.
function updateTaskSolution(taskId, solution) {
    const task = state.tasks.find(item => item.id === taskId) || state.completed.find(item => item.id === taskId);
    if (!task) return;
    task.solution = solution;
    saveState();
    renderBoard();
    showMessage('Observação salva com sucesso.');
}

// Configura as zonas onde é possível arrastar e soltar as tarefas.
function setupDropZones() {
    dropZones.forEach(zoneId => {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        zone.addEventListener('dragover', event => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            zone.classList.add('drop-target');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drop-target');
        });

        zone.addEventListener('drop', event => {
            event.preventDefault();
            zone.classList.remove('drop-target');
            const taskId = event.dataTransfer.getData('text/plain');
            const targetId = zone.id;
            moveTaskToZone(taskId, targetId);
        });
    });
}

// Move tarefas entre colunas de prioridade e a coluna de concluídas.
function moveTaskToZone(taskId, targetId) {
    const taskFromTasks = state.tasks.find(item => item.id === taskId);
    const taskFromCompleted = state.completed.find(item => item.id === taskId);

    if (targetId === 'completed-tasks') {
        if (taskFromTasks) {
            taskFromTasks.completed = true;
            state.tasks = state.tasks.filter(item => item.id !== taskId);
            state.completed.unshift(taskFromTasks);
            saveState();
            renderBoard();
        }
        return;
    }

    const targetPriority = targetId.replace('-column', '');
    if (!['high', 'medium', 'low'].includes(targetPriority)) return;

    if (taskFromTasks) {
        taskFromTasks.urgency = targetPriority;
        saveState();
        renderBoard();
    } else if (taskFromCompleted) {
        taskFromCompleted.completed = false;
        taskFromCompleted.urgency = targetPriority;
        state.completed = state.completed.filter(item => item.id !== taskId);
        state.tasks.unshift(taskFromCompleted);
        saveState();
        renderBoard();
    }
}

// Alterna o status de concluída para em andamento e vice-versa.
function toggleTaskStatus(taskId, completed) {
    if (completed) {
        const taskIndex = state.completed.findIndex(item => item.id === taskId);
        if (taskIndex < 0) return;
        const [task] = state.completed.splice(taskIndex, 1);
        task.completed = false;
        state.tasks.unshift(task);
    } else {
        const taskIndex = state.tasks.findIndex(item => item.id === taskId);
        if (taskIndex < 0) return;
        const [task] = state.tasks.splice(taskIndex, 1);
        task.completed = true;
        state.completed.unshift(task);
    }

    saveState();
    renderBoard();
}

// Exibe mensagens temporárias no topo do conteúdo principal.
function showMessage(message) {
    const main = document.querySelector('main');
    const alertBox = document.createElement('div');
    alertBox.className = 'alert';
    alertBox.textContent = message;

    const existing = document.querySelector('.alert');
    if (existing) existing.remove();

    main.prepend(alertBox);
    setTimeout(() => alertBox.remove(), 3200);
}

// Salva o estado atual em localStorage, para manter as tarefas após recarregar a página.
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Carrega o estado salvo do localStorage, se houver.
function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
        const parsed = JSON.parse(stored);
        state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        state.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
    } catch (error) {
        state.tasks = [];
        state.completed = [];
    }
}
