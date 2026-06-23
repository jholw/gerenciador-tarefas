import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { socketService } from './services/socket.service';

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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api/auth', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API funcionando', timestamp: new Date().toISOString() });
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO
socketService.initialize(server);

// Start server
server.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         Daily Task Generator API             ║
║──────────────────────────────────────────────║
║  Status: 🟢 Online                          ║
║  Port:   ${config.port}                               ║
║  Mode:   ${config.nodeEnv.toUpperCase()}                        ║
║  URL:    http://localhost:${config.port}              ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;