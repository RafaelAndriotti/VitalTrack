import { request } from '@/services/http';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types';

export const authApi = {
  register: (data: RegisterPayload) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data, auth: false }),

  login: (data: LoginPayload) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data, auth: false }),
};
