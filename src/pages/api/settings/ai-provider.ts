import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { getAiSettingsView, parseAiSettings, resetAiSettings, saveAiSettings, testAiConfig } from '@/services/ai-settings';

/**
 * The organization's AI provider. Any member can see which provider and model
 * are in use; only Admins can change them. API keys are never returned.
 */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { organizationId, role, email } = req.user;
  if (!organizationId) return res.status(400).json({ error: 'AI settings belong to an organization.' });
  const isAdmin = role === 'Admin';

  try {
    if (req.method === 'GET') {
      await dbConnect();
      const organization = await Organization.findById(organizationId).select('name').lean();
      return res.status(200).json({ settings: await getAiSettingsView(organizationId), canEdit: isAdmin, organizationName: organization?.name ?? '' });
    }

    if (!isAdmin) return res.status(403).json({ error: 'Only organization admins can change the AI provider.' });

    if (req.method === 'POST' && req.query.action === 'test') {
      const { config, error } = await parseAiSettings(organizationId, req.body ?? {});
      if (!config) return res.status(400).json({ error });
      const result = await testAiConfig(config);
      return res.status(result.ok ? 200 : 422).json(result);
    }

    if (req.method === 'PUT') {
      const { config, error } = await parseAiSettings(organizationId, req.body ?? {});
      if (!config) return res.status(400).json({ error });
      // Refuse to save something that doesn't work, so AI features don't break for the whole organization.
      const result = await testAiConfig(config);
      if (!result.ok) return res.status(422).json({ error: `The provider rejected these settings: ${result.message}` });
      await saveAiSettings(organizationId, config, email);
      return res.status(200).json({ settings: await getAiSettingsView(organizationId), test: result });
    }

    if (req.method === 'DELETE') {
      await resetAiSettings(organizationId);
      return res.status(200).json({ settings: await getAiSettingsView(organizationId) });
    }

    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[ai-settings] Request failed:', error);
    return res.status(500).json({ error: 'Could not update AI settings.' });
  }
}

export default withAuth(handler);
