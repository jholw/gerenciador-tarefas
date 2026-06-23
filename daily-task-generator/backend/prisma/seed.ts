import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dailytask.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@dailytask.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@dailytask.com' },
    update: {},
    create: {
      name: 'Gerente',
      email: 'manager@dailytask.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      emailVerified: true,
    },
  });
  console.log(`✅ Manager criado: ${manager.email}`);

  // Create collaborator user
  const collabPassword = await bcrypt.hash('collab123', 12);
  const collaborator = await prisma.user.upsert({
    where: { email: 'colaborador@dailytask.com' },
    update: {},
    create: {
      name: 'Colaborador',
      email: 'colaborador@dailytask.com',
      passwordHash: collabPassword,
      role: 'COLLABORATOR',
      emailVerified: true,
    },
  });
  console.log(`✅ Colaborador criado: ${collaborator.email}`);

  // Create guest user
  const guestPassword = await bcrypt.hash('guest123', 12);
  const guest = await prisma.user.upsert({
    where: { email: 'convidado@dailytask.com' },
    update: {},
    create: {
      name: 'Convidado',
      email: 'convidado@dailytask.com',
      passwordHash: guestPassword,
      role: 'GUEST',
      emailVerified: true,
    },
  });
  console.log(`✅ Convidado criado: ${guest.email}`);

  // Create a demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project' },
    update: {},
    create: {
      id: 'demo-project',
      name: 'Projeto Demo - TaskFlow',
      description: 'Projeto de demonstração para testar as funcionalidades do Daily Task Generator',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
          { userId: manager.id, role: 'MANAGER' },
          { userId: collaborator.id, role: 'COLLABORATOR' },
          { userId: guest.id, role: 'GUEST' },
        ],
      },
    },
  });
  console.log(`✅ Projeto demo criado: ${project.name}`);

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
    await prisma.kanbanColumn.upsert({
      where: { id: `col_${project.id}_${col.name.toLowerCase().replace(/\s/g, '_')}` },
      update: {},
      create: {
        id: `col_${project.id}_${col.name.toLowerCase().replace(/\s/g, '_')}`,
        projectId: project.id,
        name: col.name,
        order: col.order,
        color: col.color,
        wipLimit: col.wipLimit || 0,
      },
    });
  }
  console.log('✅ Colunas Kanban criadas');

  // Create demo tasks
  const demoTasks = [
    { title: 'Configurar ambiente de desenvolvimento', description: 'Instalar dependências e configurar o projeto', priority: 'high', columnId: 'col_demo-project_concluído', assignedTo: admin.id },
    { title: 'Implementar autenticação JWT', description: 'Criar sistema de login com JWT e refresh tokens', priority: 'critical', columnId: 'col_demo-project_em_desenvolvimento', assignedTo: manager.id },
    { title: 'Criar tela de dashboard', description: 'Desenvolver dashboard com gráficos e indicadores', priority: 'high', columnId: 'col_demo-project_a_fazer', assignedTo: collaborator.id },
    { title: 'Implementar chat em tempo real', description: 'Usar Socket.IO para chat entre membros do projeto', priority: 'medium', columnId: 'col_demo-project_em_revisão', assignedTo: manager.id },
    { title: 'Corrigir bug no quadro Kanban', description: 'O drag and drop não está funcionando no Safari', priority: 'high', columnId: 'col_demo-project_em_desenvolvimento', assignedTo: collaborator.id },
    { title: 'Documentar API REST', description: 'Criar documentação completa dos endpoints', priority: 'low', columnId: 'col_demo-project_backlog' },
    { title: 'Testes de integração', description: 'Cobrir principais fluxos com testes automatizados', priority: 'medium', columnId: 'col_demo-project_backlog' },
  ];

  for (const task of demoTasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        projectId: project.id,
        columnId: task.columnId,
        assignedTo: task.assignedTo || null,
        createdBy: admin.id,
        status: task.columnId === 'col_demo-project_concluído' ? 'done' : 
                task.columnId === 'col_demo-project_em_desenvolvimento' ? 'in-progress' : 'pending',
        completedAt: task.columnId === 'col_demo-project_concluído' ? new Date().toISOString() : null,
      },
    });
  }
  console.log('✅ Tarefas demo criadas');

  // Create a demo sprint
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  await prisma.scrumSprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1',
      goal: 'MVP da plataforma com funcionalidades básicas',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active',
    },
  });
  console.log('✅ Sprint demo criada');

  // Create demo chat
  const chat = await prisma.chat.create({
    data: {
      projectId: project.id,
      type: 'project',
      name: 'Chat do Projeto Demo',
    },
  });

  // Create demo messages
  await prisma.chatMessage.createMany({
    data: [
      { chatId: chat.id, userId: admin.id, message: 'Bem-vindos ao projeto TaskFlow! 🚀', type: 'text' },
      { chatId: chat.id, userId: manager.id, message: 'Vamos começar a organizar as tarefas da Sprint 1', type: 'text' },
      { chatId: chat.id, userId: collaborator.id, message: 'Já estou revisando os requisitos', type: 'text' },
    ],
  });
  console.log('✅ Chat demo criado');

  // Create demo notifications
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, projectId: project.id, title: 'Bem-vindo!', message: 'Seu projeto foi criado com sucesso', type: 'success' },
      { userId: manager.id, projectId: project.id, title: 'Nova Sprint', message: 'Sprint 1 foi iniciada', type: 'info' },
      { userId: collaborator.id, projectId: project.id, title: 'Nova tarefa', message: 'Você foi atribuído à tarefa "Criar tela de dashboard"', type: 'info' },
    ],
  });
  console.log('✅ Notificações demo criadas');

  console.log(`
╔══════════════════════════════════════════════╗
║         Seed concluído com sucesso!          ║
║──────────────────────────────────────────────║
║  Usuários criados:                           ║
║    Admin:       admin@dailytask.com          ║
║    Manager:     manager@dailytask.com        ║
║    Colaborador: colaborador@dailytask.com    ║
║    Convidado:   convidado@dailytask.com      ║
║                                              ║
║  Senha padrão: [nome]123                     ║
║  (ex: admin123, manager123, etc)             ║
╚══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });