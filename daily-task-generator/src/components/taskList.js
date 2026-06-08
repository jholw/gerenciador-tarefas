// O componente TaskList organiza tarefas, aplicando ordenação e exibindo o conteúdo.
// Ele encapsula responsabilidades de adição, remoção e renderização das tarefas.
class TaskList {
    constructor(tasks = []) {
        // Recebe um array de tarefas ao inicializar ou cria um novo array vazio.
        this.tasks = tasks;
    }

    addTask(task) {
        // Insere a tarefa no início e mantém a lista ordenada.
        this.tasks.unshift(task);
        this.sortTasks();
    }

    removeTask(taskId) {
        // Remove a tarefa filtrando pelo identificador único.
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    sortTasks() {
        // Atribui valores numéricos para cada nível de prioridade/unidade de medida.
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        this.tasks.sort((a, b) => {
            const urgencyA = priorityOrder[a.urgency] || 0;
            const urgencyB = priorityOrder[b.urgency] || 0;
            const importanceA = priorityOrder[a.importance] || 0;
            const importanceB = priorityOrder[b.importance] || 0;

            if (urgencyA !== urgencyB) {
                return urgencyB - urgencyA;
            }
            return importanceB - importanceA;
        });
    }

    render(containerElement) {
        // Transforma as tarefas em HTML e coloca tudo dentro do elemento container.
        containerElement.innerHTML = this.tasks.map(task => task.render()).join('');
    }
}

export default TaskList;