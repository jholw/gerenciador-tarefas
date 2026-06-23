import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { retrospectiveService, sprintService } from '../services/api';

export default function RetrospectivePage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<{ wentWell: string[]; toImprove: string[]; actionItems: string[] }>({
    wentWell: [], toImprove: [], actionItems: [],
  });
  const [newItems, setNewItems] = useState({ wentWell: '', toImprove: '', actionItems: '' });

  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.list(projectId!),
    enabled: !!projectId,
  });

  const sprints = sprintsData?.data?.data || [];
  const completedSprints = sprints.filter((s: any) => s.status === 'completed');

  const createMutation = useMutation({
    mutationFn: (data: any) => retrospectiveService.create(projectId!, data),
    onSuccess: () => {
      toast.success('Retrospectiva salva!');
      setItems({ wentWell: [], toImprove: [], actionItems: [] });
    },
  });

  const handleAdd = (section: 'wentWell' | 'toImprove' | 'actionItems') => {
    const value = newItems[section].trim();
    if (!value) return;
    setItems(prev => ({ ...prev, [section]: [...prev[section], value] }));
    setNewItems(prev => ({ ...prev, [section]: '' }));
  };

  const handleSave = () => {
    if (completedSprints.length === 0) {
      toast.error('Complete uma sprint primeiro');
      return;
    }
    createMutation.mutate({
      sprintId: completedSprints[0].id,
      wentWell: items.wentWell,
      toImprove: items.toImprove,
      actionItems: items.actionItems,
    });
  };

  const columns = [
    { key: 'wentWell' as const, label: '👍 O que foi bem', color: 'border-green-500/30 bg-green-500/5' },
    { key: 'toImprove' as const, label: '👎 O que melhorar', color: 'border-red-500/30 bg-red-500/5' },
    { key: 'actionItems' as const, label: '🎯 Ações', color: 'border-purple-500/30 bg-purple-500/5' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retrospectiva da Sprint</h1>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium">💾 Salvar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => (
          <div key={col.key} className={`bg-card border rounded-xl p-4 ${col.color}`}>
            <h3 className="font-semibold mb-3">{col.label}</h3>
            <div className="space-y-2 mb-3">
              {items[col.key].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-sm">
                  <span>{item}</span>
                  <button onClick={() => setItems(prev => ({ ...prev, [col.key]: prev[col.key].filter((_, idx) => idx !== i) }))} className="text-xs text-red-400">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar item..."
                value={newItems[col.key]}
                onChange={e => setNewItems(prev => ({ ...prev, [col.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd(col.key)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border text-sm"
              />
              <button onClick={() => handleAdd(col.key)} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}