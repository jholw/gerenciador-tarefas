import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    toast.success('Configurações salvas!');
    // Em produção, chamaria a API de atualização de perfil
  };

  const handleExport = () => {
    toast.success('Dados exportados com sucesso!');
  };

  const handleImport = () => {
    toast.success('Dados importados com sucesso!');
  };

  const handleClear = () => {
    if (confirm('Tem certeza? Todos os dados serão perdidos!') && confirm('Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border opacity-50" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Função</label>
            <input type="text" value={user?.role || ''} disabled className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Preferências</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
            <span className="text-sm">Notificações do sistema</span>
          </label>
          <button onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium">Salvar Configurações</button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Gerenciar Dados</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground">📤 Exportar Dados</button>
          <button onClick={handleImport} className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground">📥 Importar Dados</button>
          <button onClick={handleClear} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20">🗑️ Limpar Todos os Dados</button>
        </div>
      </div>
    </div>
  );
}