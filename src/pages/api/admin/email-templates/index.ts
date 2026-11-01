import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { getTemplateDefinition, listTemplates, saveTemplate } from '@/services/platform/email-templates';
import { recordAudit } from '@/services/audit/record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = requirePlatformAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') return res.status(200).json({ templates: await listTemplates() });

    if (req.method === 'PUT') {
      const { key, subject, body, reset } = req.body ?? {};
      if (typeof key !== 'string' || !getTemplateDefinition(key)) return res.status(400).json({ error: 'Unknown template.' });
      if (reset === true) {
        await saveTemplate(key, null, null, admin.email);
      } else {
        if (typeof subject !== 'string' || !subject.trim() || subject.length > 200) return res.status(400).json({ error: 'Enter a subject of up to 200 characters.' });
        if (typeof body !== 'string' || !body.trim() || body.length > 5000) return res.status(400).json({ error: 'Enter a body of up to 5,000 characters.' });
        await saveTemplate(key, subject.trim(), body.trim(), admin.email);
      }
      void recordAudit(req, { id: admin.employeeId, name: admin.name, email: admin.email, role: admin.role }, 200);
      return res.status(200).json({ templates: await listTemplates() });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[admin] Email template request failed:', error);
    return res.status(500).json({ error: 'Could not update email templates.' });
  }
}
