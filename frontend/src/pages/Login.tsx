import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { YmeLogo } from '@/components/ui/YmeLogo';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] relative">
      {/* Subtle brand ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff63f6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#151e33]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <YmeLogo className="h-24 sm:h-28 w-auto transition-transform hover:scale-105" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#151e33]">
            YME APP
          </h1>
          <p className="text-xs sm:text-sm text-[#151e33]/60 mt-1 font-medium">
            Plataforma Integrada de Gestão de Membros & Progressão
          </p>
        </div>

        <Card className="bg-white border-[#151e33]/15 shadow-clean-lg">
          <CardHeader className="pb-4 text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-[#151e33]">
              Entrar na Conta
            </CardTitle>
            <CardDescription className="text-[#151e33]/60">
              Utiliza o teu email institucional <span className="text-[#151e33] font-semibold font-mono">@yme.pt</span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ff63f6]/10 border border-[#ff63f6]/40 text-[#151e33] text-xs animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#ff63f6]" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              <Input
                label="Email Institucional"
                type="email"
                placeholder="nome.apelido@yme.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4 text-[#151e33]" />}
                required
              />

              <Input
                label="Palavra-passe"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 text-[#151e33]" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-semibold"
                isLoading={isLoading}
              >
                <span>Aceder à APP</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
