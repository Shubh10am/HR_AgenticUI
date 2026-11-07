import { apiRoute } from '@/lib/api-route';

/** Community routes use the shared organisation API wrapper. */
export const communityRoute = (handlers: Parameters<typeof apiRoute>[0]) => apiRoute(handlers, 'community');
