import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectService, authService } from '../services/api';
import { getInitials, getRoleLabel } from '../lib/utils';

export default function MembersPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('COLLABORATOR');

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId!),
    enabled: !!projectId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => authService.getAllUsers(),
  });

  const project = projectData?.data?.data;
  const members = project?.members || [];
  const allUsers = usersData?.data?.data || [];

  const addMutation = useMutation({
    mutationFn: () => projectService.addMember(projectId!, selectedUser, selectedRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Membro adicionado!');
      setShowAdd(false);
      setSelectedUser('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectService.removeMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Membro removido');
    },
  });

  const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];
  const availableUsers = allUsers.filter((u: any) => !members.some((m: any) => m.user?.id === u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros do Projeto</h1>
          {project && <p className="text-sm text-muted-foreground">{project.name}</p>}
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium">+ Adicionar Membro</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Adicionar Membro</h2>
            <div className="space-y-4">
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                <option value="">Selecione um usuário</option>
                {availableUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                <option value="MANAGER">Gestor</option>
                <option value="COLLABORATOR">Colaborador</option>
                <option value="GUEST">Convidado</option>
              </select>
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground">Cancelar</button>
                <button onClick={() => addMutation.mutate()} disabled={!selectedUser} className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-medium disabled:opacity-50">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member: any, index: number) => (
          <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[index % colors.length] }}>
              {getInitials(member.user?.name)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{member.user?.name}</p>
              <p className="text-xs text-muted-foreground">{member.user?.email}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400">{getRoleLabel(member.role)}</span>
            {member.userId !== project?.ownerId && (
              <button
                onClick={() => { if (confirm('Remover este membro?')) removeMutation.mutate(member.userId); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}