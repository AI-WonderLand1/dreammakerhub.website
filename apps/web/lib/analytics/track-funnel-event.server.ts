import 'server-only';

/**
 * Send a conversion only after its authoritative server-side operation succeeds.
 * A missing analytics key or an Amplitude outage must never undo a signup,
 * project creation, workspace launch, or Stripe webhook. Event identifiers deduplicate retries.
 */
export async function trackFunnelEvent(
  eventType: 'Signup Completed' | 'Project Created' | 'Workspace Launched' | 'Subscription Started',
  userId: string,
  eventId: string,
  eventProperties?: Record<string, string>,
): Promise<boolean> {
  const apiKey = process.env.AMPLITUDE_API_KEY || process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey || !userId || !eventId) return false;

  try {
    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        events: [{
          user_id: userId,
          event_type: eventType,
          insert_id: `${eventType}:${eventId}`,
          time: Date.now(),
          ...(eventProperties ? { event_properties: eventProperties } : {}),
        }],
      }),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.warn('[funnel-analytics] Amplitude ingestion failed:', response.status);
      return false;
    }
    return true;
  } catch {
    console.warn('[funnel-analytics] Amplitude ingestion unavailable');
    return false;
  }
}
