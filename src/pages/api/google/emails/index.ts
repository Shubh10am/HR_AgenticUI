
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getGmailService } from '@/services/google';
import { JSDOM } from 'jsdom';

// Helper function to decode email body
function decodeEmailBody(payload: any): string {
    try {
        if (payload.mimeType === 'text/html' && payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }
        
        if (payload.parts) {
            // Prioritize HTML part for better formatting
            const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html' && p.body?.data);
            if (htmlPart) {
                return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
            }

            // Fallback to plain text if no HTML part is found
            const plainTextPart = payload.parts.find((p: any) => p.mimeType === 'text/plain' && p.body?.data);
            if (plainTextPart) {
                // To render newlines correctly in HTML, we wrap plain text in a <pre> tag.
                const text = Buffer.from(plainTextPart.body.data, 'base64').toString('utf-8');
                return `<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`;
            }

            // Recursively search in multipart/alternative if parts exist but are not html/plain
             const multipartAlternative = payload.parts.find((p: any) => p.mimeType === 'multipart/alternative' && p.parts);
             if (multipartAlternative) {
                 return decodeEmailBody(multipartAlternative);
             }
        }
        
        // Final fallback for top-level body data, assuming it's plain text.
        if (payload.body?.data) {
             const text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
             return `<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`;
        }

        return '';
    } catch (e) {
        console.error("Error decoding email body part", e);
        return "<b>[Content could not be decoded]</b>";
    }
}


async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
    const { mailbox = 'inbox', limit = 20, pageToken, category } = req.query;

    try {
        const gmail = await getGmailService(req.user.id);
        if (!gmail) {
            return res.status(401).json({ error: 'Google authentication required.' });
        }

        let labelIds: string[] = [];
        if (mailbox === 'inbox') labelIds.push('INBOX');
        if (mailbox === 'sent') labelIds.push('SENT');
        if (mailbox === 'spam') labelIds.push('SPAM');
        if (category && typeof category === 'string' && category !== 'all') {
            const categoryLabel = `CATEGORY_${category.toUpperCase()}`;
            if (['CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'].includes(categoryLabel)) {
                labelIds.push(categoryLabel);
            }
        }
        
        const listRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: Number(limit),
            labelIds: labelIds.length > 0 ? labelIds : undefined,
            // Using q for category might be redundant if labelIds is used, but can be a fallback.
            q: (category && typeof category === 'string' && category !== 'all') ? `category:${category}` : '',
            pageToken: pageToken as string | undefined,
        });

        const messages = listRes.data.messages || [];
        const nextPageToken = listRes.data.nextPageToken || null;

        if (messages.length === 0) {
            return res.status(200).json({ emails: [], nextPageToken });
        }

        const emailPromises = messages.map(async (message) => {
            if (!message.id) return null;
            const msg = await gmail.users.messages.get({ userId: 'me', id: message.id, format: 'full' });
            const headers = msg.data.payload?.headers;
            if (!headers) return null;

            const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
            const toHeader = headers.find(h => h.name?.toLowerCase() === 'to')?.value || '';
            const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
            const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

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
        res.status(200).json({ emails, nextPageToken });

    } catch (error: any) {
        console.error('Error fetching emails:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch emails from Google.' });
    }
}

export default withAuth(handler);
