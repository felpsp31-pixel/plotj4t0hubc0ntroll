import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPasswordCached, cachePassword, clearPasswordCache } from '@/lib/passwordCache';

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
    const restore = async () => {
      const session = getSession();
      if (session) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            await supabase.auth.signInAnonymously();
          }
        } catch { /* ignore */ }
      }
      setAuthenticated(!!session);
      setLoading(false);
    };
    restore();
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

      const { data, error } = await supabase.functions.invoke('validate-password', {
        body: { password: normalizedPassword, type: 'access_password' },
      });

      if (error || !data?.valid) return false;

      await supabase.auth.signInAnonymously();
      setSession();
      setAuthenticated(true);
      return true;
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
