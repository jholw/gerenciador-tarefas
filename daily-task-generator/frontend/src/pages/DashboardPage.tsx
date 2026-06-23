import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService, sprintService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn, getPriorityColor, getStatusLabel } from '../lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  });

  const projects = projectsData?.data?.data || [];

  const { data: statsData } = useQuery({
    queryKey: ['project-stats', selectedProject],
    queryFn: () => projectService.getStats(selectedProject),
    enabled: !!selectedProject,
  });

  const stats = statsData?.data?.data;

  const { data: velocityData } = useQuery({
    queryKey: ['velocity', selectedProject],
    queryFn: () => sprintService.getVelocity(selectedProject),
    enabled: !!selectedProject,
  });

  const velocity = velocityData?.data?.data || [];

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.name}!</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 rounded-xl bg-secondary/30 border border-border text-foreground text-sm"
        >
          <option value="">Selecione um projeto</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total de Tarefas" value={stats.totalTasks} color="#3b82f6" />
          <StatCard label="Concluídas" value={stats.completedTasks} color="#22c55e" />
          <StatCard label="Em Andamento" value={stats.inProgress} color="#f59e0b" />
          <StatCard label="Atrasadas" value={stats.overdue} color="#ef4444" />
          <StatCard label="Story Points" value={stats.completedStoryPoints} color="#8b5cf6" />
          <StatCard label="Pendentes" value={stats.pending} color="#6b7280" />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Column */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Tarefas por Coluna</h3>
          {stats?.tasksByColumn && Object.entries(stats.tasksByColumn).map(([col, count]: any) => (
            <div key={col} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{col}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${(count / Math.max(stats.totalTasks, 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Task Types */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Tipos de Tarefa</h3>
          {stats?.taskTypes && Object.entries(stats.taskTypes).map(([type, count]: any) => {
            const colors: Record<string, string> = {
              task: '#3b82f6', bug: '#ef4444', feature: '#22c55e',
              improvement: '#8b5cf6', epic: '#f59e0b',
            };
            const labels: Record<string, string> = {
              task: 'Tarefa', bug: 'Bug', feature: 'Funcionalidade',
              improvement: 'Melhoria', epic: 'Épico',
            };
            return (
              <div key={type} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{labels[type] || type}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / Math.max(stats.totalTasks, 1)) * 100}%`, backgroundColor: colors[type] }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Velocity Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Velocidade da Equipe</h3>
          {velocity.length > 0 ? (
            <div className="space-y-3">
              {velocity.map((v: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{v.sprintName}</span>
                    <span className="font-medium">{v.completedPoints} pts</span>
                  </div>
                  <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${(v.completedPoints / Math.max(...velocity.map((x: any) => x.completedPoints), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhuma sprint concluída ainda</p>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Projetos Ativos</h3>
          <div className="space-y-3">
            {projects.map((project: any) => (
              <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                <span className="text-lg">📁</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project._count?.tasks || 0} tarefas</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Ativo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}