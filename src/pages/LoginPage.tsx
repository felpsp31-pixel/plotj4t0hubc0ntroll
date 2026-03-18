import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setTimeout(() => {
      // AVISO: senha comparada no frontend via variável de ambiente.
      // Para uso interno — não expor este sistema publicamente sem autenticação server-side.
      const envPass = import.meta.env.VITE_SYSTEM_PASSWORD;
      console.log('[LoginPage] env defined:', typeof envPass !== 'undefined', '| input length:', password.length, '| match:', password === envPass);
      if (password === envPass) {
        sessionStorage.setItem('system_auth', 'true');
        navigate('/');
      } else {
        setError(true);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Logo Plotjato"
            className="h-20 sm:h-28 w-auto object-contain"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mt-3">Plotjato</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Digite a senha de acesso"
                  className="pl-9 text-base"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">Senha incorreta</p>}
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
