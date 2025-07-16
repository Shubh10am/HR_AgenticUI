
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { encrypt, decrypt } from '@/lib/encryption';

type ApiKeyResponse = {
  apiKey?: string | null;
  organizationName?: string;
  message?: string;
  error?: string;
};

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse<ApiKeyResponse>
) {
  const { organizationId } = req.user;

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found.' });
  }

  if (req.method === 'GET') {
    try {
      if (organization.encryptedGoogleApiKey) {
        const decryptedKey = decrypt(organization.encryptedGoogleApiKey);
        if (decryptedKey === null && organization.encryptedGoogleApiKey) {
            return res.status(500).json({ error: 'Failed to decrypt API key. Key might be corrupted or encryption key changed.' });
        }
        return res.status(200).json({ apiKey: decryptedKey, organizationName: organization.name });
      }
      return res.status(200).json({ apiKey: null, organizationName: organization.name, message: 'No API key configured for this organization.' });
    } catch (error: any) {
      console.error('Error fetching/decrypting API key:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error during API key retrieval.' });
    }
  } 
  
  if (req.method === 'POST') {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required in the request body.' });
    }

    const encryptedKey = encrypt(apiKey.trim());
    if (!encryptedKey) {
        return res.status(500).json({ error: 'Failed to encrypt API key.' });
    }

    organization.encryptedGoogleApiKey = encryptedKey;
    try {
      await organization.save();
      return res.status(200).json({ message: 'API key saved successfully.' });
    } catch (error) {
      console.error('Error saving API key:', error);
      return res.status(500).json({ error: 'Internal Server Error while saving API key.' });
    }
  } 
  
  if (req.method === 'DELETE') {
    organization.encryptedGoogleApiKey = undefined;
    try {
      await organization.save();
      return res.status(200).json({ message: 'API key removed successfully.' });
    } catch (error) {
      console.error('Error removing API key:', error);
      return res.status(500).json({ error: 'Internal Server Error while removing API key.' });
    }
  } 
  
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler, 'Admin');
