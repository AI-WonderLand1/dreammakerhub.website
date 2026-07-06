import { getDb } from '@/lib/db';

const makeProxy = () =>
  new Proxy({} as any, {
    get(_t, prop) {
      if (prop === 'from') {
        return (table: string) => ({
          select: (..._a: any[]) => ({ data: [], error: null, eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }) }),
          insert: (_v: any) => Promise.resolve({ data: null, error: null }),
          upsert: (_v: any) => Promise.resolve({ data: null, error: null }),
          update: (_v: any) => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        });
      }
      if (prop === 'storage') {
        return {
          from: (_b: string) => ({
            upload: async () => ({ error: null }),
            getPublicUrl: (_p: string) => ({ data: { publicUrl: '' } }),
          }),
        };
      }
      return undefined;
    },
  });

export const supabaseServer = makeProxy();
export const supabaseAdmin = makeProxy();
