import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ProjectController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user!.id,
          members: {
            create: { userId: req.user!.id, role: 'MANAGER' },
          },
        },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });

      // Create default kanban columns
      const defaultColumns = [
        { name: 'Backlog', order: 0, color: '#6b7280' },
        { name: 'A Fazer', order: 1, color: '#3b82f6' },
        { name: 'Em Desenvolvimento', order: 2, color: '#f59e0b', wipLimit: 5 },
        { name: 'Em Revisão', order: 3, color: '#8b5cf6', wipLimit: 3 },
        { name: 'Homologação', order: 4, color: '#ec4899' },
        { name: 'Concluído', order: 5, color: '#22c55e' },
      ];

      for (const col of defaultColumns) {
        await prisma.kanbanColumn.create({
          data: { ...col, projectId: project.id, wipLimit: col.wipLimit || 0 },
        });
      }

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user!.id } },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
          },
          kanbanColumns: { orderBy: { order: 'asc' } },
          _count: { select: { tasks: true, sprints: true } },
        },
      });

      if (!project) throw new AppError('Projeto não encontrado', 404);

      // Verifica se o usuário é membro
      const isMember = project.members.some(m => m.userId === req.user!.id);
      if (!isMember && req.user!.role !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, status } = req.body;
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: { name, description, status },
      });
      res.json({ success: true, data: project, message: 'Projeto atualizado' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.project.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Projeto excluído' });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.body;
      const member = await prisma.projectMember.create({
        data: { projectId: req.params.id, userId, role: role || 'COLLABORATOR' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      });
      res.status(201).json({ success: true, data: member, message: 'Membro adicionado' });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      await prisma.projectMember.deleteMany({
        where: { projectId: req.params.id, userId },
      });
      res.json({ success: true, message: 'Membro removido' });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const tasks = await prisma.task.findMany({ where: { projectId } });
      const sprints = await prisma.scrumSprint.findMany({ where: { projectId } });
      const columns = await prisma.kanbanColumn.findMany({ where: { projectId }, orderBy: { order: 'asc' } });

      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completedAt).length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completedAt).length,
        totalStoryPoints: tasks.reduce((s, t) => s + t.storyPoints, 0),
        completedStoryPoints: tasks.filter(t => t.completedAt).reduce((s, t) => s + t.storyPoints, 0),
        tasksByColumn: columns.reduce((acc: any, col) => {
          acc[col.name] = tasks.filter(t => t.columnId === col.id).length;
          return acc;
        }, {}),
        taskTypes: {
          task: tasks.filter(t => t.type === 'task').length,
          bug: tasks.filter(t => t.type === 'bug').length,
          feature: tasks.filter(t => t.type === 'feature').length,
          improvement: tasks.filter(t => t.type === 'improvement').length,
          epic: tasks.filter(t => t.type === 'epic').length,
        },
        activeSprint: sprints.find(s => s.status === 'active') || null,
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();