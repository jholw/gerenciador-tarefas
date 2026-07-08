# Gerenciador de Tarefas - TaskFlow

Sistema web completo para gerenciamento de tarefas diárias com metodologias ágeis (Scrum e Kanban), desenvolvido em três camadas: **Standalone (HTML/JS)**, **Backend (Express + Prisma)** e **Frontend (React + TypeScript)**.

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

---

## Sumário

1. [Visão Geral](#-visão-geral)
2. [Funcionalidades](#-funcionalidades)
3. [Tecnologias](#-tecnologias)
4. [Estrutura do Projeto](#-estrutura-do-projeto)
5. [Como Executar](#-como-executar)
6. [Guia de Publicação na Internet](#-guia-de-publicação-na-internet)
7. [Variáveis de Ambiente](#-variáveis-de-ambiente)
8. [API Endpoints](#-api-endpoints)
9. [Correções e Melhorias (v2.1.0)](#-correções-e-melhorias-v210)

---

## 📋 Visão Geral

Aplicação moderna para gerenciamento de tarefas individuais e colaborativas utilizando **Scrum**, **Kanban** e **Gestão Ágil**. O sistema oferece:

- **Versão Standalone** (IndexedDB) — Funciona offline, sem servidor.
- **Versão Completa** (React + Express) — Backend com Prisma + SQLite e frontend React com TypeScript.
- **Chat em tempo real** com Socket.IO.
- **Autenticação** com JWT + Google OAuth 2.0.

## 🚀 Funcionalidades

### 🔐 Autenticação
- Login por e-mail e senha.
- Login com Google (OAuth 2.0).
- Cadastro de usuários.
- Recuperação de senha por e-mail.
- Refresh Token automático.

### 📋 Quadro Kanban
- Drag and Drop entre colunas.
- Colunas personalizáveis (criar, renomear, reordenar, excluir).
- Limite WIP por coluna.
- Prioridades: Crítica, Alta, Média, Baixa, Trivial.
- Subtarefas, comentários e anexos.

### 🏃 Ferramentas Scrum
- **Product Backlog** — Histórias, priorização e estimativas.
- **Sprint Planning** — Planejamento e execução.
- **Daily Standup** — Registro diário.
- **Retrospectiva** — Lições aprendidas.
- **Burndown Chart** — Gráfico automático.

### 💬 Chat & Colaboração
- Chat em tempo real por projeto.
- Notificações de sistema.
- Múltiplos projetos com membros.

### 📊 Métricas
- Dashboard com estatísticas.
- Velocidade do time.
- Gráfico de burndown.

## 🛠️ Tecnologias

### Frontend Standalone
| Tecnologia | Finalidade |
|---|---|
| HTML5 + CSS3 | Estrutura e estilização |
| JavaScript (ES6+) | Lógica |
| IndexedDB | Banco local (offline) |
| Canvas API | Gráficos |

### Frontend React
| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 18.3 | Framework UI |
| TypeScript | 5.6 | Tipagem |
| Vite | 5.4 | Bundler |
| TailwindCSS | 3.4 | Estilização |
| React Router | 6.28 | Rotas |
| React Query | 5.60 | Cache/API |
| Recharts | 2.13 | Gráficos |
| Axios | 1.7 | HTTP Client |
| Socket.IO Client | 4.8 | WebSockets |
| Radix UI | 1.2 | Componentes acessíveis |
| date-fns | 4.1 | Datas |
| Zod | 3.23 | Validação |

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4.21 | Framework HTTP |
| TypeScript | 5.6 | Tipagem |
| Prisma ORM | 5.22 | ORM |
| SQLite | - | Banco (dev) |
| Socket.IO | 4.8 | WebSockets |
| Passport | 0.7 | Autenticação Google |
| Winston | 3.15 | Logging |
| Zod | 3.23 | Validação |
| Helmet | 8.0 | Segurança |
| Compression | 1.7 | Gzip |
| Express Rate Limit | 7.4 | Rate limiting |

## 📁 Estrutura do Projeto

```
gerenciador-tarefas/
├── .gitignore
├── README.md
├── daily-task-generator/
│   ├── package.json              # Scripts principais
│   ├── README.md                 # Documentação do app
│   ├── public/                   # Versão standalone (IndexedDB)
│   │   ├── index.html            # Página principal
│   │   ├── login.html            # Login
│   │   ├── scripts/              # JS modules
│   │   │   ├── main.js
│   │   │   ├── login.js
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── chat/
│   │   │       ├── db/
│   │   │       ├── kanban/
│   │   │       ├── reminders/
│   │   │       ├── scrum/
│   │   │       └── utils/
│   │   └── styles/
│   │       ├── app.css
│   │       ├── login.css
│   │       └── main.css
│   │
│   ├── backend/                  # Backend API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Schema do banco
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── server.ts         # Entry point
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── types/
│   │       └── utils/
│   │           └── logger.ts     # Winston logger
│   │
│   ├── frontend/                 # Frontend React
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── pages/
│   │       ├── services/
│   │       └── styles/
│   │
│   ├── src/                      # Componentes legados
│   │   ├── components/
│   │   ├── data/
│   │   └── utils/
│   │
│   └── tests/
│       └── taskGenerator.test.js
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+ (recomendado 20.11+)
- npm 10+

### 1. Versão Standalone (offline)

```bash
# Abra diretamente no navegador:
daily-task-generator/public/index.html

# Ou com servidor local:
cd daily-task-generator/public
npx http-server -p 8080
# Acesse: http://localhost:8080
```

### 2. Versão Completa (React + Express)

```bash
# 1. Instalar dependências
cd daily-task-generator
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env se necessário

# 3. Iniciar o banco de dados
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# 4. Iniciar o servidor de desenvolvimento
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

### 3. Build para Produção

```bash
cd daily-task-generator
npm run build
npm start
# Servidor único em: http://localhost:3001
```

## 🌐 Guia de Publicação na Internet

### Opção 1: Vercel (Frontend + Serverless Functions)

#### 1. Backend na Vercel

Crie o arquivo `daily-task-generator/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/src/server.ts" },
    { "src": "/(.*)", "dest": "frontend/$1" }
  ]
}
```

**Passo a passo:**
1. Crie uma conta em [vercel.com](https://vercel.com)
2. Instale Vercel CLI: `npm i -g vercel`
3. Execute: `vercel login`
4. Na pasta `daily-task-generator`, execute: `vercel --prod`
5. Configure as variáveis de ambiente no dashboard da Vercel.

#### 2. Frontend na Vercel

```bash
cd daily-task-generator/frontend
npm install
vercel --prod
```

Configure as variáveis de ambiente:
```
VITE_API_URL=https://seu-backend.vercel.app/api
```

### Opção 2: Render (Backend + Frontend)

#### Backend

1. Crie conta em [render.com](https://render.com)
2. Conecte o repositório GitHub.
3. Selecione **Web Service**.
4. Configure:
   - **Root Directory:** `daily-task-generator/backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** Adicione do `.env`

#### Frontend

1. Selecione **Static Site**.
2. Configure:
   - **Root Directory:** `daily-task-generator/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:** `VITE_API_URL=https://seu-backend.onrender.com/api`

### Opção 3: DigitalOcean App Platform

1. Crie conta em [digitalocean.com](https://digitalocean.com)
2. Crie um **App Platform** conectado ao GitHub.
3. Configure dois componentes:
   - **Backend API:** TypeScript, Build: `cd backend && npm install && npm run build`, Run: `cd backend && npm start`
   - **Frontend Static:** Build: `cd frontend && npm install && npm run build`, Output: `frontend/dist`

### Opção 4: AWS EC2 (Manual)

```bash
# 1. Conecte-se à instância EC2 (Amazon Linux 2023)
ssh -i sua-chave.pem ec2-user@seu-ip

# 2. Instalar dependências
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git nginx
sudo npm i -g pm2

# 3. Clonar o repositório
git clone https://github.com/jholw/gerenciador-tarefas.git
cd gerenciador-tarefas/daily-task-generator

# 4. Instalar dependências e build
npm install
cd backend && npm install && npx prisma generate && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..

# 5. Configurar PM2 para o backend
cd backend
pm2 start dist/server.js --name taskflow-api
pm2 save
pm2 startup

# 6. Configurar NGINX como proxy reverso
sudo tee /etc/nginx/conf.d/taskflow.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /home/ec2-user/gerenciador-tarefas/daily-task-generator/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 7. Habilitar HTTPS com Certbot
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com

# 8. Reiniciar NGINX
sudo systemctl restart nginx
```

### Opção 5: Railway (Simples e Rápido)

1. Crie conta em [railway.com](https://railway.com)
2. Conecte o repositório GitHub.
3. Railway detecta automaticamente Node.js.
4. Configure:
   - **Root Directory:** `daily-task-generator`
   - **Build Command:** `cd backend && npm install && npx prisma generate && npm run build && cd ../frontend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - Adicione as variáveis de ambiente.

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | 3001 |
| `NODE_ENV` | Ambiente (development/production) | development |
| `FRONTEND_URL` | URL do frontend para CORS | http://localhost:5173 |
| `DATABASE_URL` | URL do banco SQLite | file:./dev.db |
| `JWT_SECRET` | Chave secreta JWT | - |
| `JWT_REFRESH_SECRET` | Chave secreta refresh token | - |
| `JWT_EXPIRES_IN` | Expiração do token | 24h |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | 7d |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |
| `SMTP_HOST` | Servidor SMTP | - |
| `SMTP_PORT` | Porta SMTP | 587 |
| `SMTP_USER` | Usuário SMTP | - |
| `SMTP_PASS` | Senha SMTP | - |
| `EMAIL_FROM` | Remetente de e-mail | noreply@... |

## 📡 API Endpoints

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Esqueci senha |
| POST | `/api/auth/reset-password` | Resetar senha |
| GET | `/api/auth/profile` | Perfil do usuário |
| PUT | `/api/auth/profile` | Atualizar perfil |
| GET | `/api/auth/users` | Listar usuários |

### Projetos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/projects` | Listar projetos |
| POST | `/api/projects` | Criar projeto |
| GET | `/api/projects/:id` | Detalhes do projeto |
| PUT | `/api/projects/:id` | Atualizar projeto |
| DELETE | `/api/projects/:id` | Deletar projeto |

### Tarefas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/projects/:id/tasks` | Listar tarefas |
| POST | `/api/projects/:id/tasks` | Criar tarefa |
| PUT | `/api/projects/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/projects/tasks/:id` | Deletar tarefa |

### Chat
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/chat/:projectId` | Mensagens do chat |
| POST | `/api/chat/:projectId` | Enviar mensagem |

### WebSocket (Socket.IO)
- Evento: `join:project` — Entrar em um projeto
- Evento: `leave:project` — Sair de um projeto
- Evento: `task:updated` — Tarefa atualizada (broadcast)
- Evento: `chat:message` — Nova mensagem (broadcast)

## ✅ Correções e Melhorias (v2.1.0)

### Problemas de Compatibilidade Corrigidos

| # | Problema | Solução |
|---|---|---|
| 1 | **`concurrently` v8 obsoleto** | Atualizado para v9.1.0 |
| 2 | **`@prisma/client` v5.10 desatualizado** | Atualizado para v5.22.0 |
| 3 | **`express` v4.18 com vulnerabilidades** | Atualizado para v4.21.1 |
| 4 | **`helmet` v7 obsoleto** | Atualizado para v8.0.0 |
| 5 | **`nodemailer` v6.9.8 desatualizado** | Atualizado para v6.9.16 |
| 6 | **`socket.io` v4.7.4** | Atualizado para v4.8.1 |
| 7 | **`uuid` v9.0.0** | Atualizado para v10.0.0 |
| 8 | **`dotenv` v16.4.1** | Atualizado para v16.4.5 |
| 9 | **`zod` v3.22.4** | Atualizado para v3.23.8 |
| 10 | **`cookie-parser` v1.4.6** | Atualizado para v1.4.7 |
| 11 | **`express-rate-limit` v7.1.5** | Atualizado para v7.4.1 |
| 12 | **`jsonwebtoken` v9.0.2** | Mantido (estável) com @types atualizados |
| 13 | **`bcryptjs` v2.4.3** | Mantido (estável) |
| 14 | **`cors` v2.8.5** | Mantido (estável) |
| 15 | **`typescript` v5.3.3** | Atualizado para v5.6.3 |
| 16 | **`tsx` v4.7.0** | Atualizado para v4.19.2 |
| 17 | **`vite` v5.0.12** | Atualizado para v5.4.11 |
| 18 | **`vitest` v1.2.2** | Atualizado para v2.1.5 |
| 19 | **`@vitejs/plugin-react` v4.2.1** | Atualizado para v4.3.4 |
| 20 | **`tailwindcss` v3.4.1** | Atualizado para v3.4.15 |
| 21 | **`react-router-dom` v6.22.0** | Atualizado para v6.28.0 |
| 22 | **`@tanstack/react-query` v5.17.19** | Atualizado para v5.60.5 |
| 23 | **`axios` v1.6.7** | Atualizado para v1.7.7 |
| 24 | **`date-fns` v3.3.1** | Atualizado para v4.1.0 |
| 25 | **`react-hook-form` v7.49.3** | Atualizado para v7.53.2 |
| 26 | **`recharts` v2.10.4** | Atualizado para v2.13.3 |
| 27 | **`clsx` v2.1.0** | Atualizado para v2.1.1 |
| 28 | **`tailwind-merge` v2.2.1** | Atualizado para v2.5.5 |

### Novas Bibliotecas Adicionadas

| Biblioteca | Versão | Finalidade |
|---|---|---|
| **compression** | 1.7.4 | Compressão Gzip nas respostas HTTP |
| **winston** | 3.15.0 | Sistema de logging profissional |
| **zod-validation-error** | 3.4.0 | Mensagens de erro mais claras do Zod |

### Melhorias na Estrutura

| Melhoria | Descrição |
|---|---|
| **Logger profissional** | Winston com arquivos de log separados (error.log, all.log) |
| **Compressão Gzip** | Melhor performance na transferência de dados |
| **Graceful Shutdown** | Servidor fecha conexões corretamente ao receber SIGTERM/SIGINT |
| **Rate limiting em 2 níveis** | Auth (20 req/15min) e API geral (200 req/15min) |
| **TSConfig atualizado** | Target ES2022, removido baseUrl depreciado |
| **.gitignore aprimorado** | Ignora dist/, logs/, .env, uploads/, coverage/ |
| **.env.example** | Template de variáveis de ambiente |
| **Health check avançado** | Inclui uptime e uso de memória |
| **Suporte a produção** | Servir frontend buildado pelo Express |
| **Proxy reverso NGINX** | Guia completo de configuração |

## 🤝 Contribuição

1. Fork o projeto
2. `git checkout -b feature/MinhaFeature`
3. `git commit -m 'feat: Minha nova feature'`
4. `git push origin feature/MinhaFeature`
5. Abra um Pull Request

## 📄 Licença

MIT © [Daily Task Generator Team](https://github.com/jholw/gerenciador-tarefas)

---

**Desenvolvido com ❤️ | TaskFlow v2.1.0**