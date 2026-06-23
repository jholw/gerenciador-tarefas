import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get retrospectives for a project
router.get('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const retrospectives = await prisma.retrospective.findMany({
      where: { projectId: req.params.projectId },
      include: {
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: retrospectives });
  } catch (error) {
    next(error);
  }
});

// Create retrospective for a sprint
router.post('/:projectId', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sprintId, wentWell, toImprove, actionItems, appreciation } = req.body;
    const retro = await prisma.retrospective.create({
      data: {
        projectId: req.params.projectId,
        sprintId,
        wentWell: JSON.stringify(wentWell || []),
        toImprove: JSON.stringify(toImprove || []),
        actionItems: JSON.stringify(actionItems || []),
        appreciation,
      },
    });
    res.status(201).json({ success: true, data: retro });
  } catch (error) {
    next(error);
  }
});

// Get retrospective for a specific sprint
router.get('/sprint/:sprintId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const retro = await prisma.retrospective.findFirst({
      where: { sprintId: req.params.sprintId },
    });
    if (retro) {
      retro.wentWell = JSON.parse(retro.wentWell);
      retro.toImprove = JSON.parse(retro.toImprove);
      retro.actionItems = JSON.parse(retro.actionItems);
    }
    res.json({ success: true, data: retro });
  } catch (error) {
    next(error);
  }
});

export default router;