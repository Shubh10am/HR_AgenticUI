import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { getPlatformSettings, updatePlatformSettings } from '@/services/platform/settings';
import { notifySlack } from '@/services/platform/slack';
import { recordAudit } from '@/services/audit/record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = requirePlatformAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        settings: await getPlatformSettings(),
        // Presence only: secrets stay in environment variables and are never sent to the browser.
        environment: {
          googleApiKey: Boolean(process.env.GOOGLE_API_KEY),
          brevoApiKey: Boolean(process.env.BREVO_API_KEY),
          encryptionKey: Boolean(process.env.ENCRYPTION_KEY),
        },
      });
    }

    if (req.method === 'PUT') {
      const result = await updatePlatformSettings(req.body ?? {}, admin.email);
      if (result.errors) return res.status(400).json({ error: 'Some settings are not valid.', fields: result.errors });
      void recordAudit(req, { id: admin.employeeId, name: admin.name, email: admin.email, role: admin.role }, 200);
      return res.status(200).json({ settings: result.settings });
    }

    if (req.method === 'POST' && req.query.action === 'test-slack') {
      const delivered = await notifySlack(`:white_check_mark: Test message from the admin panel, sent by ${admin.email}.`);
      return delivered ? res.status(200).json({ message: 'Test message sent to Slack.' }) : res.status(400).json({ error: 'Slack did not accept the message. Save a valid webhook URL first.' });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[admin] Settings request failed:', error);
    return res.status(500).json({ error: 'Could not save settings.' });
  }
}
