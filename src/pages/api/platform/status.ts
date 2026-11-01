import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlatformSettingsSafe } from '@/services/platform/settings';

/** Public: whether the platform is in maintenance, so the app can tell users before they try to work. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const settings = await getPlatformSettingsSafe();
  res.setHeader('Cache-Control', 'public, max-age=15');
  return res.status(200).json({
    appName: settings?.appName ?? 'HR Streamline AI',
    supportEmail: settings?.supportEmail ?? '',
    maintenanceMode: settings?.maintenanceMode ?? false,
    maintenanceMessage: settings?.maintenanceMode ? settings.maintenanceMessage : '',
  });
}
