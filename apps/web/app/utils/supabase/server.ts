import "server-only";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";

type ReplitUser = {
  id: string;
  name: string;
  email: string;
  app_metadata: { plan?: string };
  user_metadata: Record<string, any>;
  email_confirmed_at: string | null;
  created_at: string;
};

type Session = {
  user: ReplitUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
};

async function getCurrentUser(): Promise<ReplitUser | null> {
  try {
    const h = await headers();
    const userId = h.get("x-replit-user-id");
    const userName = h.get("x-replit-user-name");
    if (!userId || !userName) return null;
    return {
      id: userId,
      name: userName,
      email: `${userName}@users.replit.com`,
      app_metadata: { plan: "pro" },
      user_metadata: { name: userName },
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function makeQueryBuilder(db: ReturnType<typeof getDb>, table: string, user: ReplitUser | null) {
  let _selectCols = "*";
  let _filters: Array<[string, any]> = [];
  let _limit: number | null = null;
  let _order: { col: string; ascending: boolean } | null = null;
  let _single = false;

  const builder: any = {
    select(cols = "*") { _selectCols = cols; return builder; },
    eq(col: string, val: any) { _filters.push([col, val]); return builder; },
    gte(col: string, val: any) { return builder; },
    order(col: string, opts?: { ascending?: boolean }) {
      _order = { col, ascending: opts?.ascending ?? true };
      return builder;
    },
    limit(n: number) { _limit = n; return builder; },
    single() { _single = true; return builder; },
    maybeSingle() { _single = true; return builder; },
    async then(resolve: any) {
      try {
        let sql = `SELECT ${_selectCols} FROM ${table}`;
        const params: any[] = [];
        if (_filters.length > 0) {
          const clauses = _filters.map(([col, val], i) => {
            params.push(val);
            return `"${col}" = $${i + 1}`;
          });
          sql += ` WHERE ${clauses.join(" AND ")}`;
        }
        if (_order) sql += ` ORDER BY "${_order.col}" ${_order.ascending ? "ASC" : "DESC"}`;
        if (_limit) sql += ` LIMIT ${_limit}`;
        const result = await db.query(sql, params);
        const rows = result.rows;
        if (_single) {
          return resolve({ data: rows[0] ?? null, error: null });
        }
        return resolve({ data: rows, error: null });
      } catch (err: any) {
        return resolve({ data: null, error: { message: err.message } });
      }
    },
  };
  return builder;
}

function makeSupabaseAdapter(user: ReplitUser | null) {
  const db = getDb();

  const authAdapter = {
    async getUser() {
      return { data: { user }, error: null };
    },
    async getSession() {
      if (!user) return { data: { session: null }, error: null };
      const session: Session = {
        user,
        access_token: `replit-${user.id}`,
        refresh_token: `replit-refresh-${user.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
      };
      return { data: { session }, error: null };
    },
    async signInWithPassword(_creds: any) {
      return { data: { user: null, session: null }, error: { message: "Use Replit login" } };
    },
    async signUp(_creds: any) {
      return { data: { user: null, session: null }, error: { message: "Use Replit login" } };
    },
    async signOut() {
      return { error: null };
    },
    async exchangeCodeForSession(_code: string) {
      return { data: { user, session: null }, error: null };
    },
    async refreshSession(_opts: any) {
      return { data: { session: null }, error: { message: "Use Replit login" } };
    },
    async verifyOtp(_opts: any) {
      return { data: { user: null }, error: { message: "Not supported" } };
    },
    async resend(_opts: any) {
      return { error: null };
    },
    onAuthStateChange(_cb: any) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  };

  const fromAdapter = (table: string) => {
    const qb = makeQueryBuilder(db, table, user);

    return {
      select: (cols = "*") => {
        qb.select(cols);
        return {
          eq: (col: string, val: any) => {
            qb.eq(col, val);
            return {
              eq: (c2: string, v2: any) => { qb.eq(c2, v2); return { single: () => qb.single(), maybeSingle: () => qb.maybeSingle(), order: (c: string, o?: any) => { qb.order(c, o); return { limit: (n: number) => { qb.limit(n); return qb; }, then: qb.then }; }, then: qb.then }; },
              single: () => qb.single(),
              maybeSingle: () => qb.maybeSingle(),
              order: (c: string, o?: any) => { qb.order(c, o); return { limit: (n: number) => { qb.limit(n); return qb; }, then: qb.then }; },
              limit: (n: number) => { qb.limit(n); return qb; },
              then: qb.then,
            };
          },
          gte: (col: string, val: any) => qb,
          order: (col: string, opts?: any) => { qb.order(col, opts); return { limit: (n: number) => { qb.limit(n); return qb; }, then: qb.then }; },
          single: () => qb.single(),
          maybeSingle: () => qb.maybeSingle(),
          then: qb.then,
        };
      },
      insert: async (values: any) => {
        try {
          const v = Array.isArray(values) ? values : [values];
          for (const row of v) {
            const cols = Object.keys(row);
            const vals = Object.values(row);
            const sql = `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${vals.map((_,i) => `$${i+1}`).join(", ")}) ON CONFLICT DO NOTHING`;
            await db.query(sql, vals);
          }
          return { data: null, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      upsert: async (values: any, _opts?: any) => {
        try {
          const v = Array.isArray(values) ? values : [values];
          for (const row of v) {
            const cols = Object.keys(row);
            const vals = Object.values(row);
            const setClauses = cols.map((c, i) => `"${c}" = $${i+1}`).join(", ");
            const sql = `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${vals.map((_,i) => `$${i+1}`).join(", ")}) ON CONFLICT (id) DO UPDATE SET ${setClauses}`;
            await db.query(sql, vals);
          }
          return { data: null, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      update: (values: any) => ({
        eq: async (col: string, val: any) => {
          try {
            const cols = Object.keys(values);
            const vals = Object.values(values);
            const setClauses = cols.map((c, i) => `"${c}" = $${i+1}`).join(", ");
            vals.push(val);
            await db.query(`UPDATE ${table} SET ${setClauses} WHERE "${col}" = $${vals.length}`, vals);
            return { data: null, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
      }),
      delete: () => ({
        eq: async (col: string, val: any) => {
          try {
            await db.query(`DELETE FROM ${table} WHERE "${col}" = $1`, [val]);
            return { data: null, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
      }),
    };
  };

  return {
    auth: authAdapter,
    from: fromAdapter,
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _file: any, _opts?: any) => ({ error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
        download: async (_path: string) => ({ data: null, error: { message: "Storage not configured" } }),
        list: async (_prefix?: string) => ({ data: [], error: null }),
        remove: async (_paths: string[]) => ({ data: null, error: null }),
      }),
    },
    channel: (_name: string) => ({
      on: (_event: string, _opts: any, _cb: any) => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
  };
}

export async function createSupabaseServerClient() {
  const user = await getCurrentUser();
  return makeSupabaseAdapter(user);
}

export async function createClient() {
  return createSupabaseServerClient();
}
