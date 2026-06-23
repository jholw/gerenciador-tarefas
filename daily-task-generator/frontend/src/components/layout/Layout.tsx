import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { cn, getInitials } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Quadro Kanban', path: '/board', icon: '📋' },
  { name: 'Backlog', path: '/backlog', icon: '📥' },
  { name: 'Sprints', path: '/sprints', icon: '🏃' },
  { name: 'Daily Standup', path: '/standup', icon: '🌅' },
  { name: 'Retrospectiva', path: '/retrospective', icon: '🔄' },
  { name: 'Chat', path: '/chat', icon: '💬' },
  { name: 'Membros', path: '/members', icon: '👥' },
  { name: 'Relatórios', path: '/reports', icon: '📈' },
  { name: 'Configurações', path: '/settings', icon: '⚙️' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        'w-64 bg-card border-r border-border flex-shrink-0 flex flex-col',
        'hidden lg:flex'
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <span className="text-xs text-muted-foreground">Daily Task Generator</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )
              }
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout & Status */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
            <span className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span>⏻</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}