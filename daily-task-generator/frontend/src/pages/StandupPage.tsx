import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { standupService } from '../services/api';
import { formatDateTime, getInitials } from '../lib/utils';

export default function StandupPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');

  const { data: standupsData } = useQuery({
    queryKey: ['standups', projectId],
    queryFn: () => standupService.list(projectId!),
    enabled: !!projectId,
  });

  const standups = standupsData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => standupService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standups', projectId] });
      toast.success('Standup registrado!');
      setYesterday('');
      setToday('');
      setBlockers('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao registrar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ yesterday, today, blockers });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daily Standup</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Registrar Standup</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">O que fez ontem?</label>
              <textarea value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="Descreva o que foi feito ontem..." className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border resize-none" rows={3} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">O que vai fazer hoje?</label>
              <textarea value={today} onChange={e => setToday(e.target.value)} placeholder="Descreva o plano para hoje..." className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border resize-none" rows={3} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Impedimentos?</label>
              <textarea value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="Algo está bloqueando seu progresso?" className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border resize-none" rows={2} />
            </div>
            <button type="submit" disabled={!yesterday && !today} className="w-full py-2.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 disabled:opacity-50">
              Enviar Standup
            </button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Standups de Hoje</h2>
          <div className="space-y-3">
            {standups.map((s: any) => (
              <div key={s.id} className="p-4 rounded-lg bg-secondary/20 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(s.user?.name)}
                  </div>
                  <span className="text-sm font-medium">{s.user?.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(s.createdAt)}</span>
                </div>
                {s.yesterday && <p className="text-sm text-muted-foreground mb-1"><strong>Ontem:</strong> {s.yesterday}</p>}
                {s.today && <p className="text-sm text-muted-foreground mb-1"><strong>Hoje:</strong> {s.today}</p>}
                {s.blockers && <p className="text-sm text-red-400"><strong>Impedimentos:</strong> {s.blockers}</p>}
              </div>
            ))}
            {standups.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum standup registrado hoje.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}