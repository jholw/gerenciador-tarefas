import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { backlogService, sprintService } from '../services/api';
import { getPriorityColor, getPriorityLabel } from '../lib/utils';

export default function BacklogPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', priority: 'medium', storyPoints: 0 });

  const { data: backlogData } = useQuery({
    queryKey: ['backlog', projectId],
    queryFn: () => backlogService.list(projectId!),
    enabled: !!projectId,
  });

  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.list(projectId!),
    enabled: !!projectId,
  });

  const items = backlogData?.data?.data || [];
  const sprints = sprintsData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => backlogService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      toast.success('Item adicionado ao backlog!');
      setShowNew(false);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, sprintId }: { id: string; sprintId: string }) =>
      backlogService.moveToSprint(projectId!, id, sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      toast.success('Item movido para sprint!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backlogService.delete(projectId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      toast.success('Item removido');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backlog do Produto</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium">+ Adicionar Item</button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo Item de Backlog</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(newItem); }} className="space-y-4">
              <input type="text" placeholder="Título" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" required />
              <textarea placeholder="Descrição" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border resize-none" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })} className="px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
                <input type="number" placeholder="Story Points" value={newItem.storyPoints} onChange={e => setNewItem({ ...newItem, storyPoints: parseInt(e.target.value) || 0 })} className="px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-medium">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityColor(item.priority) }} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{getPriorityLabel(item.priority)}</span>
                {item.storyPoints > 0 && <span>{item.storyPoints} pts</span>}
                <span className={`px-1.5 py-0.5 rounded-full ${item.status === 'committed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {item.status === 'backlog' ? 'Backlog' : item.status === 'refined' ? 'Refinado' : item.status === 'ready' ? 'Pronto' : 'Comprometido'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sprints.filter((s: any) => s.status === 'planning' || s.status === 'active').length > 0 && (
                <select
                  onChange={e => {
                    if (e.target.value) moveMutation.mutate({ id: item.id, sprintId: e.target.value });
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-secondary/30 border border-border"
                  defaultValue=""
                >
                  <option value="" disabled>Mover para sprint</option>
                  {sprints.filter((s: any) => s.status === 'planning' || s.status === 'active').map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button onClick={() => { if (confirm('Remover item?')) deleteMutation.mutate(item.id); }} className="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">🗑️</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Backlog vazio. Adicione itens para planejar seu projeto.</p>
        )}
      </div>
    </div>
  );
}