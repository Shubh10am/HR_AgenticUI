import { getPlatformSettingsSafe } from './settings';

/**
 * Posts a short notification to the configured Slack webhook, if any.
 * Never throws; Slack being down must not fail the user's request.
 */
export async function notifySlack(text: string): Promise<boolean> {
  const settings = await getPlatformSettingsSafe();
  if (!settings?.slackWebhookUrl) return false;
  try {
    const response = await fetch(settings.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`[slack] Webhook answered ${response.status}.`);
    return response.ok;
  } catch (error) {
    console.error('[slack] Webhook failed:', error);
    return false;
  }
}
