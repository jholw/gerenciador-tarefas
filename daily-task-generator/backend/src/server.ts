/*
 * TaskFlow - Gerenciador de Tarefas
 * Copyright (c) 2024-2026 Jhonny Moraes. Todos os direitos reservados.
 * Software proprietário - Uso não autorizado proibido.
 * Contato: jhonnymoraes.dev@gmail.com
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import path from 'path';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { socketService } from './services/socket.service';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import reminderRoutes from './routes/reminder.routes';
import backlogRoutes from './routes/backlog.routes';
import standupRoutes from './routes/standup.routes';
import retrospectiveRoutes from './routes/retrospective.routes';

const app = express();
const server = http.createServer(app);

// Compression middleware (Gzip)
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? [config.frontendUrl] 
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // More restrictive for auth endpoints
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging with Morgan + Winston
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage().rss,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/backlog', backlogRoutes);
app.use('/api/standups', standupRoutes);
app.use('/api/retrospectives', retrospectiveRoutes);

// Serve static files in production (frontend build)
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO
socketService.initialize(server);

// Start server
server.listen(config.port, () => {
  logger.info(`
╔══════════════════════════════════════════════╗
║         Daily Task Generator API             ║
║──────────────────────────────────────────────║
║  Status: 🟢 Online                          ║
║  Port:   ${config.port.toString().padEnd(35)}║
║  Mode:   ${config.nodeEnv.toUpperCase().padEnd(35)}║
║  URL:    http://localhost:${config.port}              ║
╚══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
