import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const FirstLoginModal: React.FC = () => {
  const { user, changeFirstPassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user does not need to change password, do not render
  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.trim().length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As palavras-passe introduzidas não coincidem.');
      return;
    }

    try {
      setIsLoading(true);
      await changeFirstPassword(newPassword);
    } catch (err: any) {
      console.error('Erro ao alterar palavra-passe de primeiro acesso:', err);
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Ocorreu um erro ao definir a palavra-passe. Tenta novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151e33]/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Stripe */}
        <div className="h-2 w-full bg-gradient-to-r from-[#151e33] via-[#ff63f6] to-[#151e33]" />

        <div className="p-6 sm:p-8">
          {/* Header Icon */}
          <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#ff63f6]/10 text-[#ff63f6]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-center text-[#151e33] tracking-tight">
            Definição Obrigatória de Palavra-passe
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-center text-[#151e33]/70 leading-relaxed">
            Olá, <strong className="text-[#151e33]">{user.fullName}</strong>! Por motivos de segurança no teu primeiro acesso, deves definir a tua palavra-passe definitiva.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-[11px] sm:text-xs text-amber-900 leading-snug flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Atenção:</strong> Após guardares a tua nova palavra-passe, não será possível alterá-la de forma autónoma. Qualquer redefinição futura terá de ser solicitada à Direção.
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#151e33] uppercase tracking-wider mb-1.5">
                Nova Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff63f6] focus:ring-2 focus:ring-[#ff63f6]/20 text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#151e33] uppercase tracking-wider mb-1.5">
                Confirmar Nova Palavra-passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repete a palavra-passe"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ff63f6] focus:ring-2 focus:ring-[#ff63f6]/20 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full mt-2 py-3 bg-[#151e33] hover:bg-[#151e33]/90 text-white font-bold rounded-xl transition-all shadow-md"
            >
              {isLoading ? 'A guardar...' : 'Guardar e Aceder à Plataforma'}
            </Button>
          </form>

          {/* Logout option if user doesn't want to proceed now */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#151e33]/60 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
