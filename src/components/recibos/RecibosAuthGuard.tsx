import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

const RecibosAuthGuard = ({ children }: { children: ReactNode }) => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('recibos_auth') === 'true');
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
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'reports_password')
        .single();

      const stored = data?.value?.trim() ?? '';
      let valid = false;

      if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
        valid = bcrypt.compareSync(trimmed, stored);
      } else if (stored && stored !== 'PLACEHOLDER') {
        valid = trimmed === stored;
      }

      if (!valid) {
        const envPass = String(import.meta.env.VITE_REPORTS_PASSWORD ?? '').trim();
        valid = !!envPass && trimmed === envPass;

        if (valid) {
          const hashed = bcrypt.hashSync(trimmed, 12);
          await supabase.from('app_settings').update({ value: hashed }).eq('key', 'reports_password');
        }
      }

      if (valid) {
        sessionStorage.setItem('recibos_auth', 'true');
        setAuthed(true);
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
