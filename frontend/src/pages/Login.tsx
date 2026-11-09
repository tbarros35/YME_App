import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { YmeLogo } from '@/components/ui/YmeLogo';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preenche todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Falha na autenticação. Verifica o email e a palavra-passe.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#fafbfc] text-[#151e33] selection:bg-[#ff63f6] selection:text-[#151e33]">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header: Logo on top, "App" underneath in navy #151e33 */}
        <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 select-none group">
          <YmeLogo className="h-24 sm:h-28 w-auto transition-transform duration-200 group-hover:scale-105" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#151e33] -mt-2 sm:-mt-3 select-none">
            App
          </span>
        </div>

        {/* Login Card styled identically to dashboard/wallet surfaces */}
        <div className="bg-white rounded-[36px] p-8 sm:p-10 shadow-[0px_4px_24px_rgba(21,30,51,0.06)] border border-[#151e33]/10">
          {/* Card Header with trademark vertical pink bar */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-[3px] h-[20px] bg-[#ff63f6] rounded-full inline-block shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#151e33] tracking-tight">
              Entrar na Conta
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#151e33]/60 mb-6 font-medium">
            Utiliza o teu email institucional{' '}
            <span className="text-[#151e33] font-bold">@yme.pt</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-[#151e33] uppercase tracking-wider">
                Email Institucional
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4 text-[#151e33]/60" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome.apelido@yme.pt"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#151e33] placeholder:text-slate-400 focus:outline-none focus:border-[#ff63f6] focus:ring-2 focus:ring-[#ff63f6]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input with show/hide toggle */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-[#151e33] uppercase tracking-wider">
                Palavra-passe
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4 text-[#151e33]/60" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#151e33] placeholder:text-slate-400 focus:outline-none focus:border-[#ff63f6] focus:ring-2 focus:ring-[#ff63f6]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 flex items-center text-slate-400 hover:text-[#151e33] transition-colors"
                  title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 bg-[#151e33] hover:bg-[#1e2a47] text-white text-xs sm:text-sm font-bold rounded-xl shadow-clean-sm hover:shadow-clean-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A autenticar...</span>
                </span>
              ) : (
                <>
                  <span>Aceder à APP</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
