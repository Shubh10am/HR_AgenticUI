
import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { getCalendarService } from '@/services/google';
import { startOfDay, addDays } from 'date-fns';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
    const { maxResults = 10 } = req.query;

    try {
        const calendar = await getCalendarService(req.user.id);
        if (!calendar) {
            return res.status(401).json({ error: 'Google authentication required.' });
        }
        
        const now = new Date();
        const timeMin = startOfDay(now).toISOString();
        const timeMax = addDays(now, 30).toISOString(); // Look 30 days ahead

        const eventsRes = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: Number(maxResults),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = eventsRes.data.items || [];
        
        const formattedEvents = events.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location,
            status: event.status,
            created: event.created,
            updated: event.updated,
            attendees: event.attendees,
            organizer: event.organizer,
        }));

        res.status(200).json(formattedEvents);

    } catch (error: any) {
        console.error('Error fetching calendar events:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch calendar events from Google.' });
    }
}

export default withAuth(handler);
