// tests/taskGenerator.test.js
// Testes básicos para verificar se o gerador de tarefas funciona corretamente.

const { generateTasks } = require('../src/utils/taskGenerator');

describe('Task Generator', () => {
    it('should generate tasks with correct attributes', () => {
        const tasks = generateTasks(5); // Gera 5 tarefas de exemplo.
        expect(tasks.length).toBe(5);
        
        tasks.forEach(task => {
            // Cada tarefa deve conter os campos essenciais para o app.
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('description');
            expect(task).toHaveProperty('urgency');
            expect(task).toHaveProperty('importance');
            expect(task).toHaveProperty('necessity');
        });
    });

    it('should generate tasks with varying urgency levels', () => {
        const tasks = generateTasks(10); // Gera 10 tarefas para testar variação.
        const urgencyLevels = tasks.map(task => task.urgency);
        
        const uniqueUrgencyLevels = [...new Set(urgencyLevels)];
        expect(uniqueUrgencyLevels.length).toBeGreaterThan(1); // Confirma que há mais de um nível de urgência.
    });

    it('should generate tasks with varying importance levels', () => {
        const tasks = generateTasks(10); // Gera 10 tarefas para testar variação.
        const importanceLevels = tasks.map(task => task.importance);
        
        const uniqueImportanceLevels = [...new Set(importanceLevels)];
        expect(uniqueImportanceLevels.length).toBeGreaterThan(1); // Confirma que há mais de um nível de importância.
    });
});