# Gerenciador de Tarefas

Sistema web desenvolvido para auxiliar na organização e gerenciamento de tarefas diárias, permitindo que atividades sejam classificadas por **urgência, importância e necessidade**. O objetivo é proporcionar maior produtividade, controle e foco nas atividades do dia a dia, facilitando a tomada de decisões sobre quais tarefas devem ser executadas primeiro.

## Principais Funcionalidades

* Cadastro e gerenciamento de tarefas.
* Classificação por níveis de prioridade.
* Organização baseada na Matriz de Eisenhower (Urgente x Importante).
* Interface web simples, intuitiva e responsiva.
* Alertas visuais para tarefas prioritárias.
* Exibição dinâmica das atividades em andamento.
* Utilitários JavaScript para automação de ações e atualização de informações em tempo real.
* Controle do status das tarefas (Pendente, Em Andamento e Concluída).

## Objetivo do Projeto

Este projeto foi criado para oferecer uma solução prática para pessoas e equipes que desejam melhorar sua organização pessoal e profissional, reduzindo esquecimentos, aumentando a produtividade e mantendo o foco nas atividades que realmente geram resultados.

## Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* Componentes de interface para notificações e alertas
* Estrutura modular para fácil manutenção e expansão

## Futuras Implementações

* Sistema de autenticação de usuários.
* Integração com calendário.
* Notificações por e-mail.
* Dashboard com métricas de produtividade.
* Sincronização em nuvem.
* Aplicativo mobile.

## Licença

Este projeto é disponibilizado para fins de estudo, aprendizado e desenvolvimento de soluções de gerenciamento de tarefas.

**Gerenciador de Tarefas — Task Management PRO**

- **Idioma:** Português (pt-BR)
- **Codificação:** UTF-8

**Visão geral**

Projeto para gerar e organizar tarefas diárias por urgência, importância e necessidade. Inclui interface web simples, utilitários em JavaScript e componentes para alertas e exibição de tarefas.

**Como usar localmente**

1. Abra um terminal na pasta do projeto:

   cd C:\Users\SeuUsuario\Documents\gerenciador-tarefas

2. Instale dependências (se aplicável):

```powershell
npm install
```

3. Inicie o servidor local para visualizar a interface (ex.: pasta `daily-task-generator`):

```powershell
cd daily-task-generator
npm start
# ou use um servidor estático:
# npx serve .
```

**Estrutura sugerida**

- `daily-task-generator/`
  - `public/` — HTML, CSS, scripts e ativos
  - `src/` — componentes, utilitários e dados de exemplo
  - `tests/` — testes automatizados

**Recursos e observações**

- Urgências padronizadas: `low`, `medium`, `high`.
- Utilitários: `src/utils/priorityUtils.js`, `src/utils/taskGenerator.js`.
- Componentes visuais: `src/components/alerts.js`, `src/components/taskCard.js`.
- Dados de amostra: `src/data/sample-tasks.json`.
- Interface principal: `daily-task-generator/public/index.html`.

**Contribuição**

Sinta-se à vontade para enviar issues e pull requests com melhorias de design, acessibilidade e internacionalização.
 
