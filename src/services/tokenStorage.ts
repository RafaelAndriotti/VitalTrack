import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types';

// Chaves mantidas idênticas às versões anteriores para não deslogar usuários.
const TOKEN_KEY = 'vitaltrack_token';
const USER_KEY = 'vitaltrack_user';

// Armazenamento compatível com Web (localStorage) e nativo (SecureStore).
async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// Cache em memória: evita ler o storage a cada requisição.
// `undefined` = ainda não carregado; `null` = carregado e sem token.
let cachedToken: string | null | undefined;
// Versão incrementada por save/clear: invalida leitura de storage em andamento,
// para que uma leitura antiga nunca sobrescreva um estado mais novo.
let version = 0;
let pendingLoad: Promise<string | null> | null = null;

export function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return Promise.resolve(cachedToken);
  if (pendingLoad) return pendingLoad;

  const loadVersion = version;
  const load: Promise<string | null> = (async () => {
    let value: string | null = null;
    try {
      value = await read(TOKEN_KEY);
    } catch {
      value = null;
    }
    if (loadVersion === version) {
      cachedToken = value;
      return value;
    }
    // Invalidada por save/clear durante a leitura: vale o estado mais novo.
    return cachedToken ?? null;
  })().finally(() => {
    if (pendingLoad === load) pendingLoad = null;
  });
  pendingLoad = load;
  return load;
}

export async function saveToken(token: string): Promise<void> {
  version += 1;
  pendingLoad = null;
  cachedToken = token;
  await write(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  version += 1;
  pendingLoad = null;
  cachedToken = null;
  await remove(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await read(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function saveStoredUser(user: User): Promise<void> {
  await write(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await remove(USER_KEY);
}
