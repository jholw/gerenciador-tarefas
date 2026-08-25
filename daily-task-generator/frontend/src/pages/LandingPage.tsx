import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: '📋',
    title: 'Quadro Kanban',
    description: 'Organize tarefas por prioridade, status e fluxo de trabalho com drag-and-drop.',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
  {
    icon: '⚙️',
    title: 'Fluxo Scrum',
    description: 'Planeje sprints, backlog, standups e retrospectivas em uma única rotina.',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  },
  {
    icon: '💬',
    title: 'Colaboração em tempo real',
    description: 'Comunique-se com a equipe, acompanhe atividades e mantenha todo o projeto alinhado.',
    image:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=900&q=80',
  },
  {
    icon: '📊',
    title: 'Relatórios e métricas',
    description: 'Acompanhe produtividade, indicadores de sprint e evolução do time com clareza.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
  },
];

const metrics = [
  { value: '24/7', label: 'Acesso ao portal' },
  { value: '3x', label: 'Mais agilidade' },
  { value: '100%', label: 'Centralização' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-xl font-bold shadow-lg shadow-emerald-500/30">
              A
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Área de trabalho</div>
              <div className="text-xs text-slate-400">TaskFlow • Daily Task Generator</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/login?mode=register')}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
            >
              Criar conta
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="space-y-8">
              <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Portal de produtividade para equipes ágeis
              </span>

              <div className="space-y-5">
                <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Organize tarefas, time e entregas em um só lugar.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-300">
                  O TaskFlow centraliza gestão de projetos, backlog, reuniões diárias, Kanban e comunicação para manter a operação da sua equipe em movimento.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                >
                  Acessar portal
                </button>
                <button
                  onClick={() => navigate('/login?mode=register')}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Quero me cadastrar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-2xl font-bold text-cyan-300">{item.value}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-3 shadow-2xl shadow-cyan-500/10">
                <div className="rounded-[1.5rem] overflow-hidden border border-slate-700">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
                    alt="Equipe trabalhando em projeto"
                    className="h-[540px] w-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -left-8 bottom-8 max-w-[220px] rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl backdrop-blur-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Sprint atual</div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Entregas</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">82%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Funcionalidades</p>
            <h2 className="mt-4 text-3xl font-bold text-white">Tudo para liderar projetos com clareza</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-cyan-500/40">
                <img src={feature.image} alt={feature.title} className="h-48 w-full object-cover" />
                <div className="space-y-3 p-5">
                  <div className="text-2xl">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-300">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Workflow</p>
              <h3 className="mt-4 text-3xl font-bold text-white">Do planejamento à execução</h3>
              <ul className="mt-6 space-y-5 text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 text-cyan-300">✓</span>
                  <span>Crie projetos, defina sprints e organize backlog com prioridade por valor de negócio.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-cyan-300">✓</span>
                  <span>Use o quadro Kanban para mover tarefas, monitorar progresso e balancear a carga da equipe.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-cyan-300">✓</span>
                  <span>Revise standups, acompanhe métricas e capture aprendizados em retrospectivas.</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-blue-500/10 p-6">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80"
                alt="Dashboard ágil"
                className="h-full w-full rounded-2xl object-cover shadow-2xl shadow-cyan-500/10"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
