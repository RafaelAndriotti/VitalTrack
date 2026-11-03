import { request, enc } from '@/services/http';
import type { DailyWater, SaveWaterPayload } from '@/types';

export const waterApi = {
  get: (date: string) => request<DailyWater>(`/water?date=${enc(date)}`),

  save: (data: SaveWaterPayload) => request<DailyWater>('/water', { method: 'POST', body: data }),
};
