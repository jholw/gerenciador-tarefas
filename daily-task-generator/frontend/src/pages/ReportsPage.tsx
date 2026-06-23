import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { projectService, sprintService } from '../services/api';
import { formatDate } from '../lib/utils';

export default function ReportsPage() {
  const { projectId } = useParams();

  const { data: statsData } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => projectService.getStats(projectId!),
    enabled: !!projectId,
  });

  const { data: velocityData } = useQuery({
    queryKey: ['velocity', projectId],
    queryFn: () => sprintService.getVelocity(projectId!),
    enabled: !!projectId,
  });

  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.list(projectId!),
    enabled: !!projectId,
  });

  const stats = statsData?.data?.data;
  const velocity = velocityData?.data?.data || [];
  const sprints = sprintsData?.data?.data || [];

  const handleExportPDF = () => {
    alert('Exportação para PDF será implementada em breve.');
  };

  const handleExportCSV = () => {
    alert('Exportação para CSV será implementada em breve.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium">📄 Exportar PDF</button>
          <button onClick={handleExportCSV} className="px-4 py-2 rounded-xl border border-border text-muted-foreground">📊 Exportar CSV</button>
        </div>
      </div>

      {stats && (
        <>
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Produtividade</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">SLA - Tempo Médio de Execução</h2>
              <p className="text-3xl font-bold text-cyan-400">
                {stats.completedTasks > 0
                  ? `${(stats.totalTasks / Math.max(stats.completedTasks, 1)).toFixed(1)}`
                  : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Razão tarefas/concluídas</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Sprint Performance</h2>
              {sprints.length > 0 ? (
                <div className="space-y-3">
                  {sprints.slice(0, 3).map((sprint: any) => (
                    <div key={sprint.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{sprint.name}</span>
                      <span className="font-medium">{sprint.completedPoints}/{sprint.totalPoints} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sprint disponível</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Tipos de Tarefa</h2>
            <div className="space-y-2">
              {Object.entries(stats.taskTypes || {}).map(([type, count]: any) => {
                const labels: Record<string, string> = {
                  task: 'Tarefa', bug: 'Bug', feature: 'Funcionalidade',
                  improvement: 'Melhoria', epic: 'Épico',
                };
                return (
                  <div key={type} className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted-foreground">{labels[type] || type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}