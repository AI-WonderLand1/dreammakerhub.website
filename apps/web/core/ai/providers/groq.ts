import { logger } from '@/lib/logger';
export function groqProvider(_prompt: string) {
  return Promise.resolve({ text: '' });
}
