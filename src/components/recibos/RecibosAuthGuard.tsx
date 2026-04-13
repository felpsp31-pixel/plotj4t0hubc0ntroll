import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const RecibosAuthGuard = ({ children }: { children: ReactNode }) => {
  const [authed, setAuthed] = useState(() => {
    const token = sessionStorage.getItem('recibos_auth') ?? '';
    try {
      const decoded = atob(token);
      const [module, ts] = decoded.split(':');
      const age = Date.now() - Number(ts);
      return module === 'recibos' && age < 8 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (authed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-password', {
        body: { password: trimmed, type: 'reports_password' },
      });

      if (fnError || !data?.valid) {
        setError(true);
      } else {
        const token = btoa(`recibos:${Date.now()}:${Math.random().toString(36).slice(2)}`);
        sessionStorage.setItem('recibos_auth', token);
        setAuthed(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center mx-auto">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <Input
          type="password"
          placeholder="Senha"
          className="text-base"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
        {error && <p className="text-sm text-destructive">Senha incorreta</p>}
        <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
          {loading ? 'Verificando...' : 'Acessar'}
        </Button>
      </form>
    </div>
  );
};

export default RecibosAuthGuard;
