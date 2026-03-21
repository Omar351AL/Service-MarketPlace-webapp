import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api/client.js';
import { AuthContext } from '../context/AuthContext.js';

const SESSION_STORAGE_KEY = 'service-marketplace-session';

const readStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readStoredSession());
  const [sessionStatus, setSessionStatus] = useState('checking');

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      if (!session?.token) {
        setSessionStatus('guest');
        return;
      }

      try {
        const response = await api.getCurrentUser(session.token);

        if (!ignore) {
          const nextSession = {
            token: session.token,
            user: response.data
          };

          setSession(nextSession);
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
          setSessionStatus('authenticated');
        }
      } catch {
        if (!ignore) {
          setSession(null);
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          setSessionStatus('guest');
        }
      }
    };

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [session?.token]);

  const value = useMemo(
    () => ({
      sessionStatus,
      token: session?.token ?? null,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token && session?.user),
      isAdmin: session?.user?.role === 'ADMIN',
      login: async (payload) => {
        const response = await api.login(payload);
        const nextSession = response.data;

        setSession(nextSession);
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        setSessionStatus('authenticated');
        return nextSession;
      },
      register: async (payload) => {
        const response = await api.register(payload);
        setSessionStatus('guest');
        return response.data;
      },
      setSession: (nextSession) => {
        setSession(nextSession);

        if (nextSession) {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
          setSessionStatus('authenticated');
          return;
        }

        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionStatus('guest');
      },
      clearSession: () => {
        setSession(null);
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionStatus('guest');
      },
      logout: () => {
        setSession(null);
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionStatus('guest');
      }
    }),
    [session, sessionStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
