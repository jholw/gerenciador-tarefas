import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { chatService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime, getInitials } from '../lib/utils';

export default function ChatPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData } = useQuery({
    queryKey: ['chat', projectId],
    queryFn: () => chatService.getMessages(projectId!),
    enabled: !!projectId,
  });

  const messages = messagesData?.data?.data || [];

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatService.sendMessage(projectId!, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', projectId] });
    },
  });

  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit('join:project', projectId);
    const handler = (msg: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat', projectId] });
    };
    socket.on('chat:newMessage', handler);
    return () => {
      socket.emit('leave:project', projectId);
      socket.off('chat:newMessage', handler);
    };
  }, [socket, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat do Projeto</h1>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg: any) => {
            const isOwn = msg.user?.id === user?.id;
            const isSystem = msg.type === 'system';
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${isSystem ? 'justify-center' : ''}`}>
                {!isSystem && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(msg.user?.name || '?')}
                  </div>
                )}
                <div className={`max-w-[70%] ${isSystem ? 'bg-transparent' : isOwn ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-secondary/30 border border-border'} rounded-xl px-4 py-2.5`}>
                  {!isSystem && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{msg.user?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
                    </div>
                  )}
                  <p className={`text-sm ${isSystem ? 'text-muted-foreground italic text-center' : ''}`}>{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}