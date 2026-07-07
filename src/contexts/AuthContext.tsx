import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { auth as authApi, setToken } from '@/services/api';
import type { User } from '@/types';

const TOKEN_KEY = 'vitaltrack_token';
const USER_KEY = 'vitaltrack_user';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Armazenamento compatível com Web e Mobile
async function saveSecure(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await getSecure(TOKEN_KEY);
      const userData = await getSecure(USER_KEY);

      if (token && userData) {
        setToken(token);
        setUser(JSON.parse(userData));
      }
    } catch {
      // Token inválido ou expirado
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await authApi.login(email, password);
    setToken(response.token);
    setUser(response.user);
    await saveSecure(TOKEN_KEY, response.token);
    await saveSecure(USER_KEY, JSON.stringify(response.user));
  }

  async function signUp(email: string, password: string, name: string) {
    const response = await authApi.register(email, password, name);
    setToken(response.token);
    setUser(response.user);
    await saveSecure(TOKEN_KEY, response.token);
    await saveSecure(USER_KEY, JSON.stringify(response.user));
  }

  async function signOut() {
    setToken(null);
    setUser(null);
    await deleteSecure(TOKEN_KEY);
    await deleteSecure(USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
