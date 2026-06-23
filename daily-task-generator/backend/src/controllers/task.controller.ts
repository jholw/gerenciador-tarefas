import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export class TaskController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          type: data.type || 'task',
          storyPoints: data.storyPoints || 0,
          estimatedHours: data.estimatedHours || 0,
          dueDate: data.dueDate,
          columnId: data.columnId,
          sprintId: data.sprintId,
          projectId: data.projectId,
          assignedTo: data.assignedTo,
          createdBy: req.user!.id,
          labels: JSON.stringify(data.labels || []),
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          column: true,
          sprint: true,
        },
      });
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, sprintId, columnId, assignedTo, status, priority } = req.query;
      const where: any = {};

      if (projectId) where.projectId = projectId;
      if (sprintId) where.sprintId = sprintId;
      if (columnId) where.columnId = columnId;
      if (assignedTo) where.assignedTo = assignedTo;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          column: true,
          sprint: { select: { id: true, name: true } },
          _count: { select: { comments: true, attachments: true, subtasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          column: true,
          sprint: { select: { id: true, name: true } },
          comments: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
          },
          attachments: true,
          subtasks: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!task) throw new AppError('Tarefa não encontrada', 404);
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const updateData: any = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.storyPoints !== undefined) updateData.storyPoints = data.storyPoints;
      if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
      if (data.spentHours !== undefined) updateData.spentHours = data.spentHours;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.columnId !== undefined) updateData.columnId = data.columnId;
      if (data.sprintId !== undefined) updateData.sprintId = data.sprintId;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.blockers !== undefined) updateData.blockers = data.blockers;
      if (data.labels !== undefined) updateData.labels = JSON.stringify(data.labels);

      if (data.status === 'done' || data.columnId === 'done') {
        updateData.completedAt = new Date().toISOString();
      }

      const task = await prisma.task.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          column: true,
        },
      });
      res.json({ success: true, data: task, message: 'Tarefa atualizada' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.task.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Tarefa excluída' });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { comment } = req.body;
      const taskComment = await prisma.taskComment.create({
        data: {
          taskId: req.params.id,
          userId: req.user!.id,
          comment,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
      res.status(201).json({ success: true, data: taskComment });
    } catch (error) {
      next(error);
    }
  }

  async addSubtask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title } = req.body;
      const subtask = await prisma.subtask.create({
        data: { taskId: req.params.id, title },
      });
      res.status(201).json({ success: true, data: subtask });
    } catch (error) {
      next(error);
    }
  }

  async toggleSubtask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subtask = await prisma.subtask.findUnique({ where: { id: req.params.subtaskId } });
      if (!subtask) throw new AppError('Subtarefa não encontrada', 404);

      const updated = await prisma.subtask.update({
        where: { id: req.params.subtaskId },
        data: { completed: !subtask.completed },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();