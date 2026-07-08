# Gerenciador de Tarefas - Plataforma Completa de Gerenciamento Ágil

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

## 📋 Visão Geral

Aplicação web moderna para gerenciamento de tarefas individuais e colaborativas, utilizando conceitos de **Scrum**, **Kanban** e **Gestão Ágil**. O sistema oferece controle completo de projetos, tarefas, equipes, comunicação interna e acompanhamento de produtividade em ambiente centralizado.

Versão **standalone** com IndexedDB (funciona offline, sem necessidade de servidor backend).

## 🚀 Funcionalidades Principais

### 🔐 Autenticação e Usuários
- Login por e-mail e senha
- Login com conta Google (OAuth 2.0)
- Cadastro com nome, e-mail e senha
- Perfil de usuário com avatar
- Sistema de sessão via localStorage

### 📋 Quadro Kanban Avançado
- **Drag and Drop** completo entre colunas
- Colunas personalizáveis (criar, renomear, reordenar, excluir)
- Limite WIP por coluna
- Prioridades: Baixa, Média, Alta, Crítica
- Cartões com tipo, pontos, responsável e prazo
- ✅ **Corrigido:** Campo "Selecione Coluna" agora exibe opções corretamente

### 🏃 Ferramentas Scrum Completas
- **Product Backlog** - Criação de histórias, priorização e estimativas
- **Sprint Planning** - Planejamento de sprints
- **Sprint Board** - Controle visual da sprint
- **Daily Standup** - Registro diário de atividades
- **Sprint Retrospective** - Lições aprendidas
- **Burndown Chart** - Gráfico automático de acompanhamento
- **Velocity Chart** - Velocidade da equipe por sprint
- ✅ **Corrigido:** Daily Standup agora filtra corretamente por projeto

### 💬 Chat do Projeto
- Mensagens por projeto
- Histórico de mensagens
- Notificações de novas mensagens
- Sistema de mensagens (system messages para movimentação de tarefas)

### 📊 Dashboard e Métricas
- **Tela de boas-vindas** com instruções para novos usuários
- ✅ **Novo:** Criação de projeto diretamente da tela inicial
- Total de tarefas, concluídas, em andamento e atrasadas
- Gráfico de burndown da sprint ativa

### 🔔 Sistema de Notificações
- Notificações toast in-app
- Alertas para operações (sucesso, erro, aviso)
- Notificações de lembretes

### ⏰ Lembretes
- Notificações internas
- Repetição diária, semanal, mensal
- Filtros: Todos, Pendentes, Atrasados, Próximos
- Ativar/Desativar lembretes

### 👥 Membros do Projeto
- Adicionar/Remover participantes
- Proprietário destacado com 👑
- Gerenciamento de equipe por projeto

### 💡 Ajuda Contextual
- ✅ **Novo:** Texto instrutivo em **todas as páginas** explicando o propósito e como usar
- ✅ **Novo:** Mensagens "Selecione um projeto" quando nenhum projeto está ativo
- ✅ **Novo:** Dashboard de boas-vindas com botão rápido para criar projeto

## 🛠️ Tecnologias

### Frontend (Standalone)
| Tecnologia | Finalidade |
|------------|------------|
| HTML5 + CSS3 | Estrutura e estilização |
| JavaScript (ES6+) | Lógica da aplicação |
| IndexedDB | Banco de dados local (offline) |
| Canvas API | Gráfico burndown chart |

### Frontend (React - em desenvolvimento)
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| React | 18.2 | Framework UI |
| TypeScript | 5.3 | Tipagem estática |
| TailwindCSS | 3.4 | Estilização |
| React Router | 6.22 | Roteamento SPA |
| Recharts | 2.10 | Gráficos e charts |
| Axios | 1.6 | HTTP Client |

### Backend (em desenvolvimento)
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Node.js | 20+ | Runtime |
| Express | 4.18 | Framework HTTP |
| TypeScript | 5.3 | Tipagem estática |
| Prisma ORM | 5.10 | ORM e migrations |
| SQLite | - | Banco de dados (dev) |
| Socket.IO | 4.7 | WebSockets |

## 📁 Estrutura do Projeto

```
daily-task-generator/
├── public/                      # VERSÃO PRINCIPAL (standalone - IndexedDB)
│   ├── index.html               # Página principal da aplicação
│   ├── login.html               # Página de login/registro
│   ├── scripts/
│   │   ├── main.js              # Controlador principal (lógica da aplicação)
│   │   ├── login.js             # Script da página de login
│   │   └── modules/
│   │       ├── auth/auth.js     # Autenticação (login local + Google)
│   │       ├── chat/chat.js     # Chat do projeto
│   │       ├── db/database.js   # Camada IndexedDB
│   │       ├── reminders/reminders.js # Sistema de lembretes
│   │       ├── scrum/scrum.js   # Scrum: sprints, backlog, standups, kanban
│   │       └── utils/           # Utilitários
│   └── styles/
│       ├── app.css              # Estilos da aplicação
│       ├── login.css            # Estilos do login
│       └── main.css             # Estilos base
│
├── backend/                     # Backend (Express + Prisma - em desenvolvimento)
│   ├── prisma/
│   │   ├── schema.prisma        # Schema do banco de dados
│   │   └── seed.ts              # Seed de dados iniciais
│   └── src/
│       ├── config/              # Configurações
│       ├── controllers/         # Controladores REST
│       ├── middleware/          # Middlewares
│       ├── routes/              # Rotas da API
│       ├── services/            # Services
│       ├── types/               # Tipos TypeScript
│       └── server.ts            # Entry point
│
├── frontend/                    # Frontend React (em desenvolvimento)
├── README.md
└── package.json
```

## 🚀 Como Executar (Versão Standalone)

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Edge, etc.)
- Nenhum servidor necessário - funciona 100% offline com IndexedDB

### Execução

**Opção 1:** Abra diretamente no navegador
```bash
# Abra o arquivo index.html
daily-task-generator/public/index.html
```

**Opção 2:** Use um servidor local (recomendado)
```bash
# Com Python
cd daily-task-generator/public
python -m http.server 8080

# Com Node.js (http-server)
npx http-server daily-task-generator/public -p 8080
```

Depois acesse: **http://localhost:8080**

## 🐛 Correções Recentes (v2.0.1)

### ✅ Problemas Corrigidos

| # | Problema | Causa | Solução |
|---|----------|-------|---------|
| 1 | **Campo "Selecione Coluna" vazio no modal Nova Tarefa** | O select era limpo sem opção placeholder, ficando vazio e impedindo a criação | Adicionado `<option value="">Selecione uma coluna...</option>` como primeira opção sempre |
| 2 | **Daily Standup exibia erro ao enviar** | A função `getTodayStandups` não filtrava por `projectId`, retornando dados de todos os projetos | Adicionado filtro `.filter(s => s.projectId === projectId)` |
| 3 | **Botões "Adicionar/Salvar/Criar" sem resposta** | Faltavam validações adequadas e o fluxo de submit não verificava campos obrigatórios corretamente | Adicionadas validações com `required`, verificação de valores vazios e foco automático nos campos |
| 4 | **Erro ao criar tarefa sem coluna selecionada** | O campo coluna estava sem valor padrão e o form não validava | Adicionada validação explícita e mensagem de aviso |

### ✨ Melhorias Implementadas

| # | Melhoria | Descrição |
|---|----------|-----------|
| 1 | **Dashboard de boas-vindas** | Tela inicial com instruções e botão "Criar Novo Projeto" quando nenhum projeto está selecionado |
| 2 | **Texto instrutivo por página** | Bloco `.help-text` com 💡 explicando o propósito e funcionamento de cada seção |
| 3 | **Mensagens "Selecione um projeto"** | Cada seção exibe aviso centralizado quando não há projeto ativo |
| 4 | **Validações aprimoradas** | Todos os formulários agora validam campos obrigatórios com feedback visual |
| 5 | **Tratamento de erros** | Try/catch em todas as operações assíncronas com notificações para o usuário |
| 6 | **Limpeza de dados ao trocar projeto** | Ao desselecionar projeto, todas as visualizações são limpas corretamente |

## 📖 Guia de Uso Rápido

### Como gerenciar uma tarefa nova

1. **Crie ou selecione um projeto** na barra lateral esquerda (➕)
2. No **Quadro Kanban**, clique em **"Nova Tarefa"**
3. Preencha: título (obrigatório), descrição, prioridade, tipo
4. Selecione a **Coluna** desejada (campo obrigatório)
5. Opcional: defina responsável, story points e prazo
6. Clique em **"Criar Tarefa"**
7. Arraste os cartões entre colunas para atualizar o status

### Para começar um projeto do zero

1. Faça login ou registre-se
2. Na tela inicial, clique em **"Criar Novo Projeto"** ou no ➕ da barra lateral
3. Dê um nome ao projeto e defina a duração da sprint
4. Comece adicionando tarefas ao **Quadro Kanban**
5. Crie itens no **Backlog** e mova para uma **Sprint**

## 🔧 Configuração do Google OAuth

Para usar login com Google:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto e configure as credenciais OAuth 2.0
3. Edite o arquivo `public/scripts/modules/auth/auth.js`:
```javascript
const GOOGLE_CLIENT_ID = 'seu-client-id-aqui';
```

## 🗄️ Banco de Dados

- **Versão standalone:** IndexedDB (navegador) - nenhuma instalação necessária
- **Backend React:** SQLite (dev) / PostgreSQL (prod)

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ | TaskFlow - Gerenciamento Ágil de Projetos**