import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Link de recuperação enviado!');
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erro ao processar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#071028] via-[#0b1220] to-[#0f1724]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
            TaskFlow
          </h1>
          <p className="text-muted-foreground mt-2">Daily Task Manager</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-2">Recuperar Senha</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
          </p>

          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Email Enviado!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Se o email <strong className="text-cyan-400">{email}</strong> estiver cadastrado,
                você receberá um link de recuperação em breve.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Não encontrou? Verifique sua caixa de spam ou lixo eletrônico.
              </p>
              <Link
                to="/login"
                className="inline-block text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 TaskFlow - Daily Task Generator. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}