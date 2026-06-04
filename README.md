# Gerenciador de Tarefas

**Gerenciador de Tarefas — Task Management PRO**

- **Idioma:** Português (pt-BR)
- **Codificação:** UTF-8

**Visão geral**

Projeto para gerar e organizar tarefas diárias por urgência, importância e necessidade. Inclui interface web simples, utilitários em JavaScript e componentes para alertas e exibição de tarefas.

**Como usar localmente**

1. Abra um terminal na pasta do projeto:

   cd C:\Users\SeuUsuario.moraes\Documents\Jhonny\Aprendizado-Projetos\gerenciador-tarefas

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
 