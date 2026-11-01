import { CalendarDays, Mail, MessageCircle, Users as TeamsIcon, Video, Webcam } from 'lucide-react';
import type { CommPlatform } from '@/lib/communications';

export default function PlatformIcon({ platform }: { platform: CommPlatform }) {
  switch (platform) {
    case 'Email': return <Mail className="h-5 w-5 shrink-0 text-primary" />;
    case 'Google Meet': return <Video className="h-5 w-5 shrink-0 text-green-500" />;
    case 'Zoom': return <Webcam className="h-5 w-5 shrink-0 text-blue-500" />;
    case 'Microsoft Teams': return <TeamsIcon className="h-5 w-5 shrink-0 text-indigo-500" />;
    case 'Community': return <MessageCircle className="h-5 w-5 shrink-0 text-purple-500" />;
    default: return <CalendarDays className="h-5 w-5 shrink-0 text-amber-500" />;
  }
}
