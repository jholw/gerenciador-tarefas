const urgencyLevels = ['low', 'medium', 'high'];
const importanceLevels = ['low', 'medium', 'high'];

function generateTasks(count = 5) {
    const tasks = [];

    for (let i = 0; i < count; i += 1) {
        tasks.push({
            id: `task-${Date.now()}-${i}`,
            title: `Tarefa ${i + 1}`,
            description: `Descrição da tarefa ${i + 1}.`,
            urgency: urgencyLevels[i % urgencyLevels.length],
            importance: importanceLevels[(i + 1) % importanceLevels.length],
            necessity: (i % 2 === 0) ? 'Sim' : 'Não',
            completed: false
        });
    }

    return tasks;
}

module.exports = { generateTasks };
