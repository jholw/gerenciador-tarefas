import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { sprintController } from '../controllers/sprint.controller';
import { kanbanController } from '../controllers/kanban.controller';
import { taskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas as rotas de projeto exigem autenticação
router.use(authenticate);

// Projetos
router.post('/', projectController.create);
router.get('/', projectController.list);
router.get('/:id', projectController.getById);
router.put('/:id', projectController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), projectController.delete);

// Membros
router.post('/:id/members', authorize('ADMIN', 'MANAGER'), projectController.addMember);
router.delete('/:id/members/:userId', authorize('ADMIN', 'MANAGER'), projectController.removeMember);

// Estatísticas
router.get('/:id/stats', projectController.getStats);

// Kanban Columns
router.get('/:projectId/columns', kanbanController.getColumns);
router.post('/:projectId/columns', authorize('ADMIN', 'MANAGER'), kanbanController.createColumn);
router.put('/columns/:id', authorize('ADMIN', 'MANAGER'), kanbanController.updateColumn);
router.delete('/columns/:id', authorize('ADMIN', 'MANAGER'), kanbanController.deleteColumn);
router.put('/:projectId/columns/reorder', authorize('ADMIN', 'MANAGER'), kanbanController.reorderColumns);

// Sprints
router.post('/:projectId/sprints', authorize('ADMIN', 'MANAGER'), sprintController.create);
router.get('/:projectId/sprints', sprintController.list);
router.put('/sprints/:id/start', authorize('ADMIN', 'MANAGER'), sprintController.start);
router.put('/sprints/:id/complete', authorize('ADMIN', 'MANAGER'), sprintController.complete);
router.get('/sprints/:id/burndown', sprintController.getBurndown);
router.get('/:projectId/velocity', sprintController.getVelocity);

// Tarefas
router.get('/:projectId/tasks', taskController.list);
router.post('/:projectId/tasks', taskController.create);
router.get('/tasks/:id', taskController.getById);
router.put('/tasks/:id', taskController.update);
router.delete('/tasks/:id', authorize('ADMIN', 'MANAGER'), taskController.delete);
router.post('/tasks/:id/comments', taskController.addComment);
router.post('/tasks/:id/subtasks', taskController.addSubtask);
router.put('/tasks/:taskId/subtasks/:subtaskId', taskController.toggleSubtask);

export default router;