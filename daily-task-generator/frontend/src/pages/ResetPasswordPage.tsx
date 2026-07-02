import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (!token) {
      toast.error('Token de recuperação inválido');
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erro ao processar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#071028] via-[#0b1220] to-[#0f1724]">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Link Inválido</h2>
            <p className="text-sm text-muted-foreground mb-6">
              O link de recuperação é inválido ou expirou.
            </p>
            <Link
              to="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Senha Redefinida!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sua senha foi redefinida com sucesso.
              </p>
              <Link
                to="/login"
                className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:brightness-110 transition-all"
              >
                Fazer Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2">Redefinir Senha</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Digite sua nova senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
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
            </>
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