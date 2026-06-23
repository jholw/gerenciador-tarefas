import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sprintService, projectService } from '../services/api';
import { formatDate } from '../lib/utils';

export default function SprintsPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.list(projectId!),
    enabled: !!projectId,
  });

  const { data: burndownData } = useQuery({
    queryKey: ['burndown', sprintsData?.data?.data?.[0]?.id],
    queryFn: () => sprintService.getBurndown(sprintsData?.data?.data?.[0]?.id),
    enabled: !!sprintsData?.data?.data?.[0]?.id,
  });

  const sprints = sprintsData?.data?.data || [];
  const burndown = burndownData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => sprintService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint criada!');
      setShowNew(false);
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => sprintService.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint iniciada!');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => sprintService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint finalizada!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newSprint);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sprints</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium">+ Nova Sprint</button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nova Sprint</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nome da Sprint" value={newSprint.name} onChange={e => setNewSprint({ ...newSprint, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" required />
              <input type="text" placeholder="Objetivo" value={newSprint.goal} onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={newSprint.startDate} onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })} className="px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" required />
                <input type="date" value={newSprint.endDate} onChange={e => setNewSprint({ ...newSprint, endDate: e.target.value })} className="px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-medium">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {sprints.map((sprint: any) => {
            const progress = sprint._count?.tasks > 0 ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100) : 0;
            return (
              <div key={sprint.id} className={`bg-card border rounded-xl p-5 ${sprint.status === 'active' ? 'border-cyan-500/30' : 'border-border'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{sprint.name}</h3>
                    {sprint.goal && <p className="text-sm text-muted-foreground mt-1">🎯 {sprint.goal}</p>}
                  </div>
                  <div className="flex gap-2">
                    {sprint.status === 'planning' && (
                      <button onClick={() => startMutation.mutate(sprint.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20">Iniciar</button>
                    )}
                    {sprint.status === 'active' && (
                      <button onClick={() => completeMutation.mutate(sprint.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Finalizar</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className={`px-2 py-0.5 rounded-full ${sprint.status === 'active' ? 'bg-green-500/10 text-green-400' : sprint.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {sprint.status === 'planning' ? 'Planejamento' : sprint.status === 'active' ? 'Ativa' : 'Concluída'}
                  </span>
                  <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{sprint._count?.tasks || 0} tarefas</p>
              </div>
            );
          })}
        </div>

        {/* Burndown Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Burndown Chart</h3>
          {burndown.length > 0 ? (
            <div className="space-y-1">
              {burndown.map((point: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-muted-foreground">{point.date}</span>
                  <div className="flex-1 h-3 bg-secondary/30 rounded-sm relative">
                    <div className="absolute inset-0 flex">
                      <div className="h-full bg-cyan-500/30 rounded-l-sm" style={{ width: `${(point.ideal / Math.max(...burndown.map((b: any) => b.ideal), 1)) * 100}%` }} />
                      <div className="h-full bg-cyan-500 rounded-r-sm" style={{ width: `${((point.actual - point.ideal) / Math.max(...burndown.map((b: any) => b.actual), 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-8 text-right">{Math.round(point.actual)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}