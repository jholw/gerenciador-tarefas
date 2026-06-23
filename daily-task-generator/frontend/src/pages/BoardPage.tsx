import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectService, taskService } from '../services/api';
import { cn, getPriorityColor, getPriorityLabel, getInitials } from '../lib/utils';

export default function BoardPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', columnId: '' });

  const { data: columnsData } = useQuery({
    queryKey: ['columns', projectId],
    queryFn: () => projectService.getColumns(projectId!),
    enabled: !!projectId,
  });

  const columns = columnsData?.data?.data || [];

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
      toast.success('Tarefa criada!');
      setShowNewTask(false);
      setNewTask({ title: '', description: '', priority: 'medium', columnId: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao criar tarefa'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['columns', projectId] }),
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      await updateTaskMutation.mutateAsync({ id: taskId, data: { columnId } });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    createTaskMutation.mutate(newTask);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quadro Kanban</h1>
        <button
          onClick={() => setShowNewTask(true)}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors"
        >
          + Nova Tarefa
        </button>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewTask(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nova Tarefa</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Título da tarefa"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-foreground"
                required
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-foreground resize-none"
                rows={3}
              />
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-foreground"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
              <select
                value={newTask.columnId}
                onChange={e => setNewTask({ ...newTask, columnId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-foreground"
                required
              >
                <option value="">Selecione a coluna</option>
                {columns.map((col: any) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewTask(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-medium">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {columns.map((column: any) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-secondary/10 border border-border rounded-xl"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, column.id)}
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                <span className="font-medium text-sm">{column.name}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full">
                {column.tasks?.length || 0}{column.wipLimit > 0 ? `/${column.wipLimit}` : ''}
              </span>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {column.tasks?.map((task: any) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  className="bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground whitespace-nowrap">
                      {task.type}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPriorityColor(task.priority) }} />
                      {task.dueDate && <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.storyPoints > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{task.storyPoints}pts</span>
                      )}
                    </div>
                    {task.assignee && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(task.assignee.name)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!column.tasks || column.tasks.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}