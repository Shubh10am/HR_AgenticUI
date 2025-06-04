
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { encrypt, decrypt } from '@/lib/encryption';

type ApiKeyResponse = {
  apiKey?: string | null; // Decrypted key for GET, or part of it
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiKeyResponse>
) {
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { organizationId, role } = decodedToken;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Only Admins can manage API keys.' });
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found.' });
  }

  if (req.method === 'GET') {
    try {
      if (organization.encryptedGoogleApiKey) {
        const decryptedKey = decrypt(organization.encryptedGoogleApiKey);
        if (decryptedKey === null && organization.encryptedGoogleApiKey) { // Check if decryption explicitly failed vs. no key
            return res.status(500).json({ error: 'Failed to decrypt API key. Key might be corrupted or encryption key changed.' });
        }
        return res.status(200).json({ apiKey: decryptedKey });
      }
      return res.status(200).json({ apiKey: null, message: 'No API key configured for this organization.' });
    } catch (error: any) {
      console.error('Error fetching/decrypting API key:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error during API key retrieval.' });
    }
  } else if (req.method === 'POST') {
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
  } else if (req.method === 'DELETE') {
    organization.encryptedGoogleApiKey = undefined; // Or null, depending on schema definition
    try {
      await organization.save();
      return res.status(200).json({ message: 'API key removed successfully.' });
    } catch (error) {
      console.error('Error removing API key:', error);
      return res.status(500).json({ error: 'Internal Server Error while removing API key.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
