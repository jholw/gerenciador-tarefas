import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/prisma';

export const auditLog = (action: string, entity?: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entity: entity || '',
            entityId: req.params.id || '',
            details: JSON.stringify({
              method: req.method,
              path: req.path,
              body: req.body ? JSON.stringify(req.body).substring(0, 500) : '',
            }),
            ipAddress: req.ip || '',
          },
        });
      }
    } catch (error) {
      // Não interrompe a requisição se falhar ao registrar auditoria
      console.warn('Erro ao registrar auditoria:', error);
    }
    next();
  };
};