import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

// Schemas de validação
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = registerSchema.parse(req.body);
      const result = await authService.register(name, email, password);
      res.status(201).json({ success: true, data: result, message: 'Conta criada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      res.json({ success: true, data: result, message: 'Login realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const googleUser = (req as any).user;
      const result = await authService.googleLogin(googleUser);
      res.json({ success: true, data: result, message: 'Login Google realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, avatar } = req.body;
      const user = await authService.updateProfile(req.user!.id, { name, avatar });
      res.json({ success: true, data: user, message: 'Perfil atualizado' });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(email);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(token, password);
      res.json({ success: true, data: result, message: 'Senha redefinida com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
