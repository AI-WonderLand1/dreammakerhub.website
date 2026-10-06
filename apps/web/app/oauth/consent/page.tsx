import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ authorization_id?: string | string[] }>;

export default async function OAuthConsentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const authorizationId = Array.isArray(params.authorization_id)
    ? params.authorization_id[0]
    : params.authorization_id;

  if (!authorizationId || authorizationId.length > 2048) {
    return (
      <main className="min-h-screen bg-[#080d22] px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <h1 className="text-xl font-bold">Invalid authorization request</h1>
          <p className="mt-2 text-sm text-white/65">The OAuth authorization ID is missing or invalid.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const returnTo = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    redirect(`/public-pages/auth?redirectTo=${encodeURIComponent(returnTo)}`);
  }

  const { data: details, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !details) {
    return (
      <main className="min-h-screen bg-[#080d22] px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <h1 className="text-xl font-bold">Authorization request unavailable</h1>
          <p className="mt-2 text-sm text-white/65">{error?.message || 'The request is no longer valid.'}</p>
        </div>
      </main>
    );
  }

  if (!('authorization_id' in details)) {
    redirect(details.redirect_url);
  }

  const scopes = (details.scope || '').split(' ').filter(Boolean);

  return (
    <main className="min-h-screen bg-[#080d22] px-6 py-20 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-cyan-300/20 bg-[#11182e] p-7 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">AI WONDERLAND identity</p>
        <h1 className="mt-3 text-2xl font-bold">Authorize {details.client.name}</h1>
        <p className="mt-2 text-sm leading-6 text-white/65">
          This lets the connected application verify the same AI WONDERLAND account you already use on the website.
        </p>

        <dl className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div>
            <dt className="font-semibold text-white/80">Application</dt>
            <dd className="mt-1 text-white/60">{details.client.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-white/80">Redirect</dt>
            <dd className="mt-1 break-all text-white/60">{details.redirect_uri}</dd>
          </div>
          <div>
            <dt className="font-semibold text-white/80">Requested permissions</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {scopes.length ? scopes.map((scope) => (
                <span key={scope} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">{scope}</span>
              )) : <span className="text-white/50">No additional scopes listed.</span>}
            </dd>
          </div>
        </dl>

        <form action="/api/oauth/decision" method="POST" className="mt-6 flex gap-3">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button type="submit" name="decision" value="approve"
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-bold text-slate-950">
            Continue
          </button>
          <button type="submit" name="decision" value="deny"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white">
            Deny
          </button>
        </form>
      </section>
    </main>
  );
}
