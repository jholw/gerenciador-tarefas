import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get today's standups for a project
router.get('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const standups = await prisma.standup.findMany({
      where: { projectId: req.params.projectId, date: today },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: standups });
  } catch (error) {
    next(error);
  }
});

// Create or update today's standup
router.post('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await prisma.standup.findUnique({
      where: { projectId_userId_date: { projectId: req.params.projectId, userId: req.user!.id, date: today } },
    });

    if (existing) {
      const standup = await prisma.standup.update({
        where: { id: existing.id },
        data: {
          yesterday: req.body.yesterday,
          today: req.body.today,
          blockers: req.body.blockers,
        },
      });
      res.json({ success: true, data: standup, message: 'Standup atualizado' });
    } else {
      const standup = await prisma.standup.create({
        data: {
          projectId: req.params.projectId,
          userId: req.user!.id,
          date: today,
          yesterday: req.body.yesterday,
          today: req.body.today,
          blockers: req.body.blockers,
        },
      });
      res.status(201).json({ success: true, data: standup, message: 'Standup registrado' });
    }
  } catch (error) {
    next(error);
  }
});

// Get standup history for a project
router.get('/:projectId/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days } = req.query;
    const limit = parseInt(days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - limit);

    const standups = await prisma.standup.findMany({
      where: {
        projectId: req.params.projectId,
        createdAt: { gte: since },
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, data: standups });
  } catch (error) {
    next(error);
  }
});

export default router;