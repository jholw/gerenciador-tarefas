export function compareUrgency(taskA, taskB) {
    const order = { high: 3, medium: 2, low: 1 };
    return order[taskB.urgency] - order[taskA.urgency];
}

export function compareImportance(taskA, taskB) {
    const order = { high: 3, medium: 2, low: 1 };
    return order[taskB.importance] - order[taskA.importance];
}

export function assignPriority(task) {
    if (task.urgency === 'high') {
        return 'Prioridade Alta';
    } else if (task.urgency === 'medium') {
        return 'Prioridade Média';
    }
    return 'Prioridade Baixa';
}

export function sortTasksByPriority(tasks) {
    return tasks.sort((taskA, taskB) => {
        const urgencyComparison = compareUrgency(taskA, taskB);
        if (urgencyComparison !== 0) {
            return urgencyComparison;
        }
        return compareImportance(taskA, taskB);
    });
}
