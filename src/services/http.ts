import { API_URL } from '@/constants/config';
import { getToken } from '@/services/tokenStorage';

/** Erro HTTP/rede da API. `status` 0 = falha de conexão. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** O AuthContext registra aqui o logout; evita dependência circular. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** `false` = não envia `Authorization` (login/registro). Padrão: true. */
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const token = auth ? await getToken() : null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Erro de conexão');
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
    let message = typeof data?.error === 'string' && data.error ? data.error : `Erro ${response.status}`;
    if (response.status === 429) {
      message = 'Muitas requisições. Aguarde um instante e tente novamente.';
    }
    // 401 com token enviado = sessão inválida/expirada -> logout.
    // Sem token (ex.: senha errada no login) apenas propaga o erro.
    // Só se o token enviado ainda for o atual (um 401 atrasado não derruba sessão nova).
    if (response.status === 401 && token && token === (await getToken())) onUnauthorized?.();
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, 'Resposta inválida do servidor');
  }
}

/** Codifica um segmento de path/query. */
export const enc = encodeURIComponent;

/** Mensagem para o usuário: usa `fallback`, exceto em rate limit (429) e falha de conexão. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && (err.status === 429 || err.status === 0)) return err.message;
  return fallback;
}

/** Mensagem do próprio erro (carregamentos e autenticação). */
export function rawErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
