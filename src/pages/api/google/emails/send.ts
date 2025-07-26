
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getGmailService } from '@/services/google';
import { Base64 } from 'js-base64'; // Using js-base64 for robust encoding

type SendEmailBody = {
    to: string;
    subject: string;
    message: string;
    threadId?: string;
}

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  const { to, subject, message, threadId } = req.body as SendEmailBody;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'To, subject, and message are required.' });
  }

  try {
    const gmail = await getGmailService(req.user.id);
    if (!gmail) {
      return res.status(401).json({ error: 'Google authentication required.' });
    }

    // Gmail API requires the email to be base64url encoded
    const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        // In-Reply-To and References headers are needed for threading replies correctly
        ...(threadId ? [`In-Reply-To: <${threadId}>`, `References: <${threadId}>`] : []),
        'Content-Type: text/plain; charset=utf-8',
        '',
        message,
    ];
    const email = emailLines.join('\r\n');
    const encodedMessage = Base64.encodeURI(email);

    const requestBody = {
        raw: encodedMessage,
        ...(threadId && { threadId: threadId }),
    };

    const sendResponse = await gmail.users.messages.send({
      userId: 'me',
      requestBody: requestBody,
    });

    res.status(200).json({ message: 'Email sent successfully.', id: sendResponse.data.id });

  } catch (error: any) {
    console.error('Error sending email:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send email via Google.' });
  }
}

export default withAuth(handler);
