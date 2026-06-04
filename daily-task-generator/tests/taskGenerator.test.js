// tests/taskGenerator.test.js

const { generateTasks } = require('../src/utils/taskGenerator');

describe('Task Generator', () => {
    it('should generate tasks with correct attributes', () => {
        const tasks = generateTasks(5); // Generate 5 sample tasks
        expect(tasks.length).toBe(5);
        
        tasks.forEach(task => {
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('description');
            expect(task).toHaveProperty('urgency');
            expect(task).toHaveProperty('importance');
            expect(task).toHaveProperty('necessity');
        });
    });

    it('should generate tasks with varying urgency levels', () => {
        const tasks = generateTasks(10); // Generate 10 sample tasks
        const urgencyLevels = tasks.map(task => task.urgency);
        
        const uniqueUrgencyLevels = [...new Set(urgencyLevels)];
        expect(uniqueUrgencyLevels.length).toBeGreaterThan(1); // Ensure there are varying levels
    });

    it('should generate tasks with varying importance levels', () => {
        const tasks = generateTasks(10); // Generate 10 sample tasks
        const importanceLevels = tasks.map(task => task.importance);
        
        const uniqueImportanceLevels = [...new Set(importanceLevels)];
        expect(uniqueImportanceLevels.length).toBeGreaterThan(1); // Ensure there are varying levels
    });
});