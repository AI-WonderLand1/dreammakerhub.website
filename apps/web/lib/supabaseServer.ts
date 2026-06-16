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

<<<<<<< HEAD
function getInstance(): SupabaseClient {
  if (!_instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    _instance = createClient(url, key, { auth: { persistSession: false } });
  }
  return _instance;
}

export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target: SupabaseClient, prop: string | symbol) {
    return (getInstance() as any)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target: SupabaseClient, prop: string | symbol) {
    return (getInstance() as any)[prop];
  },
});
=======
export const supabaseServer = makeProxy();
export const supabaseAdmin = makeProxy();
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
