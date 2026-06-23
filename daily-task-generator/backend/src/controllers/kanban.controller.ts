import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';

export class KanbanController {
  async getColumns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const columns = await prisma.kanbanColumn.findMany({
        where: { projectId: req.params.projectId },
        include: {
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { order: 'asc' },
      });
      res.json({ success: true, data: columns });
    } catch (error) {
      next(error);
    }
  }

  async createColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, color, wipLimit } = req.body;
      const maxOrder = await prisma.kanbanColumn.aggregate({
        where: { projectId: req.params.projectId },
        _max: { order: true },
      });

      const column = await prisma.kanbanColumn.create({
        data: {
          projectId: req.params.projectId,
          name,
          color: color || '#6b7280',
          wipLimit: wipLimit || 0,
          order: (maxOrder._max.order || -1) + 1,
        },
      });
      res.status(201).json({ success: true, data: column });
    } catch (error) {
      next(error);
    }
  }

  async updateColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, color, wipLimit, order } = req.body;
      const column = await prisma.kanbanColumn.update({
        where: { id: req.params.id },
        data: { name, color, wipLimit, order },
      });
      res.json({ success: true, data: column });
    } catch (error) {
      next(error);
    }
  }

  async deleteColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Move tasks to first available column before deleting
      const column = await prisma.kanbanColumn.findUnique({ where: { id: req.params.id } });
      if (column) {
        const firstColumn = await prisma.kanbanColumn.findFirst({
          where: { projectId: column.projectId, id: { not: req.params.id } },
          orderBy: { order: 'asc' },
        });
        if (firstColumn) {
          await prisma.task.updateMany({
            where: { columnId: req.params.id },
            data: { columnId: firstColumn.id },
          });
        }
      }
      await prisma.kanbanColumn.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Coluna removida' });
    } catch (error) {
      next(error);
    }
  }

  async reorderColumns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { columnIds } = req.body;
      for (let i = 0; i < columnIds.length; i++) {
        await prisma.kanbanColumn.update({
          where: { id: columnIds[i] },
          data: { order: i },
        });
      }
      res.json({ success: true, message: 'Colunas reordenadas' });
    } catch (error) {
      next(error);
    }
  }
}

export const kanbanController = new KanbanController();