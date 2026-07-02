import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { sendPasswordResetEmail } from '../utils/email';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email já cadastrado', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id);
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('Esta conta usa login social. Use o Google para entrar.', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastAccess: new Date() },
    });

    const tokens = await this.generateTokens(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async googleLogin(googleUser: { id: string; email: string; name: string; picture?: string }) {
    let user = await prisma.user.findUnique({ where: { googleId: googleUser.id } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: googleUser.email } });
      if (user) {
        // Vincula conta Google ao usuário existente
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.id, avatar: googleUser.picture, emailVerified: true },
        });
      } else {
        // Cria novo usuário
        user = await prisma.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.id,
            avatar: googleUser.picture,
            emailVerified: true,
          },
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastAccess: new Date() },
    });

    const tokens = await this.generateTokens(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError('Token de refresh inválido ou expirado', 401);
    }

    // Remove token antigo
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    // Gera novos tokens
    const tokens = await this.generateTokens(stored.user.id);
    return tokens;
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        emailVerified: true,
        lastAccess: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });
    return user;
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Não revelar se o email existe ou não
      return { message: 'Se o email existir, você receberá um link de recuperação.' };
    }

    if (!user.passwordHash) {
      return { message: 'Se o email existir, você receberá um link de recuperação.' };
    }

    // Invalida tokens anteriores não utilizados
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Gera novo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Envia email
    await sendPasswordResetEmail(user.email, token, user.name);

    return { message: 'Se o email existir, você receberá um link de recuperação.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new AppError('Token inválido ou expirado', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' };
  }
}

export const authService = new AuthService();
