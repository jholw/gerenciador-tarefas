import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Get project backlog
router.get('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.backlogItem.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// Create backlog item
router.post('/:projectId', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.backlogItem.create({
      data: {
        projectId: req.params.projectId,
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority || 'medium',
        storyPoints: req.body.storyPoints || 0,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// Update backlog item
router.put('/:projectId/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.backlogItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// Move backlog item to sprint
router.post('/:projectId/:id/move-to-sprint', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sprintId } = req.body;
    const item = await prisma.backlogItem.update({
      where: { id: req.params.id },
      data: { sprintId, status: 'committed' },
    });

    // Create task from backlog item
    await prisma.task.create({
      data: {
        title: item.title,
        description: item.description,
        priority: item.priority,
        storyPoints: item.storyPoints,
        projectId: item.projectId,
        sprintId,
        createdBy: req.user!.id,
      },
    });

    res.json({ success: true, data: item, message: 'Item movido para sprint' });
  } catch (error) {
    next(error);
  }
});

// Delete backlog item
router.delete('/:projectId/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.backlogItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Item removido do backlog' });
  } catch (error) {
    next(error);
  }
});

export default router;