import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login — will be replaced with Supabase auth
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, hsl(222 47% 11%), hsl(215 28% 17%))' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-foreground">Gestão Financeira</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 65%)' }}>
            Acesse sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card rounded-xl shadow-lg p-6 space-y-5 border border-border"
        >
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-foreground">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="voce@empresa.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-pw" className="text-foreground">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-pw"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
