import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export class SocketService {
  private io: Server | null = null;

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (token) {
          const decoded = jwt.verify(token as string, config.jwt.secret) as any;
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true },
          });
          if (user) {
            socket.userId = user.id;
            socket.userName = user.name;
          }
        }
      } catch {
        // Conexão sem autenticação é permitida para leitura
      }
      next();
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket conectado: ${socket.id} (${socket.userName || 'anônimo'})`);

      // Entrar em salas de projeto
      socket.on('join:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`${socket.userName} entrou no projeto ${projectId}`);
      });

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      // Mensagens de chat
      socket.on('chat:message', async (data: { projectId: string; message: string }) => {
        try {
          if (!socket.userId) return;

          let chat = await prisma.chat.findFirst({
            where: { projectId: data.projectId, type: 'project' },
          });

          if (!chat) {
            chat = await prisma.chat.create({
              data: { projectId: data.projectId, type: 'project' },
            });
          }

          const chatMessage = await prisma.chatMessage.create({
            data: {
              chatId: chat.id,
              userId: socket.userId,
              message: data.message,
              type: 'text',
            },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          });

          this.io?.to(`project:${data.projectId}`).emit('chat:newMessage', chatMessage);
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
        }
      });

      // Atualizações de tarefa
      socket.on('task:update', (data: { taskId: string; projectId: string }) => {
        socket.to(`project:${data.projectId}`).emit('task:updated', data);
      });

      // Notificações
      socket.on('notification:send', (data: { projectId: string; notification: any }) => {
        this.io?.to(`project:${data.projectId}`).emit('notification:new', data.notification);
      });

      socket.on('disconnect', () => {
        console.log(`Socket desconectado: ${socket.id}`);
      });
    });

    return this.io;
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const socketService = new SocketService();