// Este utilitário ajuda a comparar e classificar tarefas com base em urgência e importância.

export function compareUrgency(taskA, taskB) {
    // Retorna um valor numérico para comparar dois níveis de urgência.
    const order = { high: 3, medium: 2, low: 1 };
    return order[taskB.urgency] - order[taskA.urgency];
}

export function compareImportance(taskA, taskB) {
    // Retorna um valor numérico para comparar dois níveis de importância.
    const order = { high: 3, medium: 2, low: 1 };
    return order[taskB.importance] - order[taskA.importance];
}

export function assignPriority(task) {
    // Cria uma etiqueta legível em português baseada na urgência da tarefa.
    if (task.urgency === 'high') {
        return 'Prioridade Alta';
    } else if (task.urgency === 'medium') {
        return 'Prioridade Média';
    }
    return 'Prioridade Baixa';
}

export function sortTasksByPriority(tasks) {
    // Ordena a lista completa de tarefas usando urgência e importância.
    return tasks.sort((taskA, taskB) => {
        const urgencyComparison = compareUrgency(taskA, taskB);
        if (urgencyComparison !== 0) {
            return urgencyComparison;
        }
        return compareImportance(taskA, taskB);
    });
}

