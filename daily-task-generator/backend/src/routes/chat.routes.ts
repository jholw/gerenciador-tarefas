import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get chat messages for a project
router.get('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let chat = await prisma.chat.findFirst({
      where: { projectId: req.params.projectId, type: 'project' },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { projectId: req.params.projectId, type: 'project' },
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    next(error);
  }
});

// Send a chat message via REST (fallback for Socket.IO)
router.post('/:projectId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let chat = await prisma.chat.findFirst({
      where: { projectId: req.params.projectId, type: 'project' },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { projectId: req.params.projectId, type: 'project' },
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        userId: req.user!.id,
        message: req.body.message,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

export default router;