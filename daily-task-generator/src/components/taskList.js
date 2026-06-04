class TaskList {
    constructor(tasks = []) {
        this.tasks = tasks;
    }

    addTask(task) {
        this.tasks.unshift(task);
        this.sortTasks();
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    sortTasks() {
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
        containerElement.innerHTML = this.tasks.map(task => task.render()).join('');
    }
}

export default TaskList;