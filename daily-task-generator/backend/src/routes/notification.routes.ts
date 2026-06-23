import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ success: true, message: 'Notificação marcada como lida' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true, message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    next(error);
  }
});

// Create notification
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, projectId, title, message, type } = req.body;
    const notification = await prisma.notification.create({
      data: { userId, projectId, title, message, type: type || 'info' },
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

export default router;