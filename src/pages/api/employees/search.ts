
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import Employee from '@/models/Employee';

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  const { organizationId } = req.user;
  const { name } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Search query "name" is required.' });
  }

  try {
    const employees = await Employee.find({
      organizationId,
      name: { $regex: name, $options: 'i' }, // Case-insensitive search
    })
    .select('_id name') // Select only the fields needed for mentions
    .limit(10) // Limit the number of suggestions
    .lean();

    return res.status(200).json(employees);
  } catch (error) {
    console.error('Error searching employees:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
