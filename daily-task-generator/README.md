# daily-task-generator
Gerador de Tarefas Diárias com Quadro Kanban

## Visão Geral
Aplicação web para criar, priorizar e concluir tarefas usando um quadro Kanban. O app organiza tarefas em colunas de prioridade Alta, Média e Baixa, e mantém uma lista de tarefas concluídas para controle rápido.

## Funcionalidades Atualizadas
- Criação de tarefas com urgência e importância.
- Visualização em quadro Kanban por prioridade.
- Marcação de tarefas como concluídas com opção de reabrir.
- Interface moderna em português (pt-BR) com tema escuro.
- Persistência local usando `localStorage` para manter tarefas entre sessões.

## Estrutura do Projeto
```
daily-task-generator
├── public
│   ├── index.html          # Página principal da aplicação
│   ├── styles
│   │   └── main.css        # Estilos atualizados do app
│   └── scripts
│       └── main.js         # Lógica principal da interface
├── src
│   ├── components          # Módulos e componentes do projeto
│   └── utils               # Utilitários de prioridade e geração de tarefas
├── tests
│   └── taskGenerator.test.js # Testes automatizados para geração de tarefas
├── package.json            # Configuração do npm
└── README.md               # Documentação do projeto
```

## Começando
### Pré-requisitos
- Node.js e npm instalados.

### Instalação
1. Navegue até a pasta do projeto:
   ```powershell
   cd daily-task-generator
   ```
2. Instale as dependências:
   ```powershell
   npm install
   ```

### Uso
1. Inicie o servidor local:
   ```powershell
   npm start
   ```
2. Abra a URL exibida pelo `live-server`.
3. Utilize o formulário para adicionar tarefas e movê-las no quadro Kanban.

## Testes
Para rodar os testes de geração de tarefas:
```powershell
npm test
```

## Contribuição
Contribuições são bem-vindas! Abra uma issue ou envie um pull request com melhorias.

## Licença
Este projeto está licenciado sob MIT. Veja o arquivo LICENSE para mais detalhes.
