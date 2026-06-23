import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get user reminders
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user!.id },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ success: true, data: reminders });
  } catch (error) {
    next(error);
  }
});

// Create reminder
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        remindBefore: req.body.remindBefore || 30,
        repeat: req.body.repeat || 'none',
        priority: req.body.priority || 'medium',
        taskId: req.body.taskId,
      },
    });
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
});

// Update reminder
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
});

// Toggle reminder active state
router.put('/:id/toggle', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reminder = await prisma.reminder.findUnique({ where: { id: req.params.id } });
    if (!reminder) {
      res.status(404).json({ success: false, error: 'Lembrete não encontrado' });
      return;
    }
    const updated = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { active: !reminder.active },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete reminder
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Lembrete excluído' });
  } catch (error) {
    next(error);
  }
});

export default router;