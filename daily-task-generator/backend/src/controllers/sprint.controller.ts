import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export class SprintController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, goal, startDate, endDate, projectId } = req.body;
      const sprint = await prisma.scrumSprint.create({
        data: { name, goal, startDate, endDate, projectId },
      });
      res.status(201).json({ success: true, data: sprint });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sprints = await prisma.scrumSprint.findMany({
        where: { projectId: req.params.projectId },
        include: {
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: sprints });
    } catch (error) {
      next(error);
    }
  }

  async start(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sprint = await prisma.scrumSprint.update({
        where: { id: req.params.id },
        data: { status: 'active' },
      });
      res.json({ success: true, data: sprint, message: 'Sprint iniciada' });
    } catch (error) {
      next(error);
    }
  }

  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sprint = await prisma.scrumSprint.update({
        where: { id: req.params.id },
        data: { status: 'completed', completedAt: new Date().toISOString() },
      });
      res.json({ success: true, data: sprint, message: 'Sprint finalizada' });
    } catch (error) {
      next(error);
    }
  }

  async getBurndown(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sprint = await prisma.scrumSprint.findUnique({
        where: { id: req.params.id },
        include: { tasks: { select: { storyPoints: true, completedAt: true, createdAt: true } } },
      });

      if (!sprint) throw new AppError('Sprint não encontrada', 404);

      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPoints = sprint.tasks.reduce((sum, t) => sum + t.storyPoints, 0);
      const burndownData = [];

      for (let day = 0; day <= totalDays; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        const completedPoints = sprint.tasks
          .filter(t => t.completedAt && t.completedAt.split('T')[0] <= dateStr)
          .reduce((sum, t) => sum + t.storyPoints, 0);

        burndownData.push({
          date: dateStr,
          ideal: totalPoints - (totalPoints / totalDays) * day,
          actual: totalPoints - completedPoints,
        });
      }

      res.json({ success: true, data: burndownData });
    } catch (error) {
      next(error);
    }
  }

  async getVelocity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sprints = await prisma.scrumSprint.findMany({
        where: { projectId: req.params.projectId, status: 'completed' },
        include: { tasks: { select: { storyPoints: true, completedAt: true } } },
        orderBy: { completedAt: 'desc' },
        take: 5,
      });

      const velocity = sprints.map(s => ({
        sprintName: s.name,
        completedPoints: s.tasks.filter(t => t.completedAt).reduce((sum, t) => sum + t.storyPoints, 0),
      }));

      res.json({ success: true, data: velocity });
    } catch (error) {
      next(error);
    }
  }
}

export const sprintController = new SprintController();