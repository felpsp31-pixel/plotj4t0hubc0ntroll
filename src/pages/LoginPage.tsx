import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPassword = password.trim();
    if (!normalizedPassword) return;

    setLoading(true);
    try {
      const ok = await login(normalizedPassword);
      if (ok) {
        sessionStorage.setItem('system_auth', 'true');
        navigate('/');
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
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
