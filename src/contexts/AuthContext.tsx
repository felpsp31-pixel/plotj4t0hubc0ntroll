import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import bcrypt from 'bcryptjs';

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_KEY = 'app_session';

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  login: async () => false,
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

const getSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { expiresAt };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const setSession = () => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_TIMEOUT }));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
    } catch { /* ignore */ }
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (authenticated) {
      setSession(); // refresh expiry
      timeoutRef.current = setTimeout(signOut, SESSION_TIMEOUT);
    }
  }, [authenticated, signOut]);

  useEffect(() => {
    const session = getSession();
    setAuthenticated(!!session);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [authenticated, resetTimer]);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const normalizedPassword = password.trim();
      if (!normalizedPassword) return false;

      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'access_password')
        .single();

      const storedValue = data?.value?.trim() ?? '';
      let valid = false;

      if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$') || storedValue.startsWith('$2y$')) {
        valid = bcrypt.compareSync(normalizedPassword, storedValue);
      } else if (storedValue) {
        valid = normalizedPassword === storedValue;
      }

      if (!valid) {
        const envPassword = String(import.meta.env.VITE_SYSTEM_PASSWORD ?? '').trim();
        valid = !!envPassword && normalizedPassword === envPassword;

        if (valid) {
          const hashed = bcrypt.hashSync(normalizedPassword, 12);
          await supabase.from('app_settings').update({ value: hashed }).eq('key', 'access_password');
        }
      }

      if (valid) {
        await supabase.auth.signInAnonymously();
        setSession();
        setAuthenticated(true);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
