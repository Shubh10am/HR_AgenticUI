import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This endpoint is deprecated. SuperAdmins should log in via the main /api/auth/login route.
  res.setHeader('Allow', []);
  return res.status(404).json({ error: 'This endpoint is no longer in use. Please use the main login page.' });
}
