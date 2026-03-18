import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RecibosAuthGuard = ({ children }: { children: ReactNode }) => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('recibos_auth') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_REPORTS_PASSWORD) {
      sessionStorage.setItem('recibos_auth', 'true');
      setAuthed(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
        />
        {error && <p className="text-sm text-destructive">Senha incorreta</p>}
        <Button type="submit" className="w-full">Acessar</Button>
      </form>
    </div>
  );
};

export default RecibosAuthGuard;
