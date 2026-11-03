import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi } from '@/features/auth/api';
import { setUnauthorizedHandler } from '@/services/http';
import {
  getToken,
  saveToken,
  clearToken,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
} from '@/services/tokenStorage';
import type { AuthResponse, User } from '@/types';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Incrementa a cada login/cadastro: o boot só limpa sessão incompleta se nenhuma nova começou.
  const sessionVersion = useRef(0);

  const signOut = useCallback(async () => {
    // clearToken zera o cache em memória antes de tocar o storage, então a sessão
    // acaba neste processo mesmo se o storage falhar.
    setUser(null);
    const wipe = () => Promise.all([clearToken(), clearStoredUser()]);
    try {
      await wipe();
    } catch {
      try {
        await wipe();
      } catch (err) {
        // Dados podem sobrar no storage e reabrir a sessão no próximo boot.
        console.warn('Falha ao apagar a sessão do armazenamento', String(err));
      }
    }
  }, []);

  // 401 em qualquer requisição autenticada -> encerra a sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let active = true;
    const bootVersion = sessionVersion.current;
    const clearStale = async () => {
      if (sessionVersion.current !== bootVersion) return; // login durante o boot: não apagar
      await Promise.all([clearToken(), clearStoredUser()]).catch(() => {});
    };
    (async () => {
      try {
        const [token, stored] = await Promise.all([getToken(), getStoredUser()]);
        if (token && stored) {
          // Login feito durante o boot prevalece sobre o usuário armazenado.
          if (active && sessionVersion.current === bootVersion) setUser(stored);
        } else if (token || stored) {
          // Sessão incompleta (token sem usuário ou usuário sem token): descarta ambos.
          await clearStale();
        }
      } catch {
        // Armazenamento ilegível/corrompido: segue deslogado e limpa o que der.
        await clearStale();
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const startSession = useCallback(async (response: AuthResponse) => {
    sessionVersion.current += 1;
    // Falha ao persistir não impede o login: o estado em memória (cache do token
    // e `user`) vale nesta sessão; só não sobrevive a reiniciar o app.
    try {
      await saveToken(response.token);
      await saveStoredUser(response.user);
    } catch (err) {
      console.warn('Falha ao persistir a sessão', String(err));
    }
    setUser(response.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await startSession(await authApi.login({ email, password }));
    },
    [startSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      await startSession(await authApi.register({ email, password, name }));
    },
    [startSession]
  );

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
