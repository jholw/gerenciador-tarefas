// Este componente define a lógica de gerenciamento de uma lista de tarefas.
// Apesar de estar em taskCard.js, ele serve como estrutura para agrupar e renderizar tarefas.
class TaskList {
    constructor(tasks = []) {
        // Inicializa uma lista de tarefas vazia ou com tarefas existentes.
        this.tasks = tasks;
    }

    addTask(task) {
        // Adiciona a nova tarefa na frente do array para que ela apareça primeiro.
        this.tasks.unshift(task);
        this.sortTasks();
    }

    removeTask(taskId) {
        // Remove uma tarefa com base no seu identificador único.
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    sortTasks() {
        // Ordena as tarefas por urgência e importância para priorizar o mais crítico.
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
        // Converte cada tarefa em HTML chamando task.render() e insere no container.
        containerElement.innerHTML = this.tasks.map(task => task.render()).join('');
    }
}

export default TaskList;