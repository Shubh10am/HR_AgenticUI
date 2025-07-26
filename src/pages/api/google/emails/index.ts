
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getGmailService } from '@/services/google';

// Helper function to decode email body
function decodeEmailBody(payload: any): string {
    try {
        if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' && part.body.data) {
                    return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
            }
            // Fallback to finding HTML or nested parts
            for (const part of payload.parts) {
                 if (part.mimeType === 'text/html' && part.body.data) {
                    // Basic stripping of HTML tags for plain text view
                    const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    return html.replace(/<[^>]*>/g, '');
                }
                if (part.parts) {
                    const nestedBody = decodeEmailBody(part);
                    if (nestedBody) return nestedBody;
                }
            }
        }
        if (payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }
        return '';
    } catch (e) {
        console.error("Error decoding email body part", e);
        return "[Content could not be decoded]";
    }
}


async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
    const { mailbox = 'inbox', limit = 10 } = req.query;

    try {
        const gmail = await getGmailService(req.user.id);
        if (!gmail) {
            return res.status(401).json({ error: 'Google authentication required.' });
        }

        let labelIds: string[] = [];
        if (mailbox === 'inbox') labelIds.push('INBOX');
        if (mailbox === 'sent') labelIds.push('SENT');
        if (mailbox === 'spam') labelIds.push('SPAM');
        
        const listRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: Number(limit),
            labelIds: labelIds.length > 0 ? labelIds : undefined,
        });

        const messages = listRes.data.messages || [];
        if (messages.length === 0) {
            return res.status(200).json([]);
        }

        const emailPromises = messages.map(async (message) => {
            if (!message.id) return null;
            const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });
            const headers = msg.data.payload?.headers;
            if (!headers) return null;

            const fromHeader = headers.find(h => h.name === 'From')?.value || '';
            const toHeader = headers.find(h => h.name === 'To')?.value || '';
            const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '';
            const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

            const body = msg.data.payload ? decodeEmailBody(msg.data.payload) : '';

            return {
                id: msg.data.id,
                threadId: msg.data.threadId,
                from: fromHeader,
                to: toHeader,
                subject: subjectHeader,
                snippet: msg.data.snippet,
                body: body,
                date: dateHeader,
            };
        });

        const emails = (await Promise.all(emailPromises)).filter(Boolean);
        res.status(200).json(emails);

    } catch (error: any) {
        console.error('Error fetching emails:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch emails from Google.' });
    }
}

export default withAuth(handler);
