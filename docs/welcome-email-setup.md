# DreamMakerHub welcome email: deployment and activation

The production Supabase project has the `onboarding_email_outbox` migration and `send-welcome-emails` Edge Function installed. The function defaults to **disabled**. Signup confirmation queues one service welcome email per user; there is deliberately no historical-user backfill and no promotional/AI-generated copy.

## 1. Verify a delivery provider

The worker currently implements the Resend Emails API. Verify `dreammakerhub.website` with Resend, adding the DNS records it provides in Cloudflare. Existing Zoho Mail can remain your business mailbox; check the new DNS records do not replace or conflict with existing MX/SPF/DKIM configuration. A verified sender can be `DreamMakerHub <hello@dreammakerhub.website>` if approved in the email provider. Do not commit API credentials.

In the **Supabase project > Edge Functions > Secrets** configure:

- `RESEND_API_KEY` = the private API key for the verified domain.
- `WELCOME_FROM_EMAIL` = the approved sender address, e.g. `DreamMakerHub <hello@dreammakerhub.website>`.
- `WELCOME_EMAIL_ENABLED` = `true` only after a controlled end-to-end test.

The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are read by the function. Never expose them to client-side code. The worker requires a service-role JWT in its `Authorization` header and is deployed with JWT verification enabled. It does not accept arbitrary recipients from requests.

## 2. Schedule the worker securely

Use the Supabase Cron dashboard or `pg_cron` + `pg_net` to invoke `https://hhdduixckgllodixrejp.supabase.co/functions/v1/send-welcome-emails` with a POST every minute. Store the service-role token securely using Supabase Vault; do not paste it into SQL migrations or GitHub. The request must include `Authorization: Bearer <service-role-jwt>`. The request body is ignored. See https://supabase.com/docs/guides/functions/schedule-functions. Scheduling is not enabled by the migration, to avoid storing credentials without the owner configuring them.

## 3. Verify delivery

Create a fresh test account using an address you control and confirm it. Query the `onboarding_email_outbox` table privately: it should have one `pending` row. Invoke the Edge Function using the configured server-side scheduler. Check that its status becomes `sent`, inspect the provider's delivery status, and verify the message in the recipient's inbox. Reconfirming the account must not create a second row. Confirm that no public/anon/authenticated user can select the private queue.

The `Idempotency-Key` is stable per queue row. Transient failures are retried up to five attempts with a backoff. A permanent provider error is recorded as `failed` after retries; an unknown crash on the last lease may need manual investigation. Watch failed and processing jobs in the Supabase dashboard.

## 4. Follow-ups / AI / Amplitude

A `Signup Completed` event has been observed in the connected Amplitude project, but `Project Created` and `Subscription Started` were not found at setup time. Keep the **welcome** email driven by Supabase Auth, never by client analytics. Do not activate promotional messages or AI-generated campaigns until there is explicit marketing consent, an unsubscribe mechanism, documented event identities, and a review of the approved AI message templates. The current worker intentionally sends only the transactional welcome message.
