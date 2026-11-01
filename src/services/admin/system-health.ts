import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';

export type CheckStatus = 'operational' | 'degraded' | 'down' | 'not_configured';

export interface HealthCheck {
  id: string;
  name: string;
  status: CheckStatus;
  detail: string;
  latencyMs?: number;
}

/** Above this database round trip, the database is reported as degraded. */
const SLOW_DB_MS = 500;
/** Above this share of failed actions in the last hour, the API is reported as degraded. */
const DEGRADED_ERROR_RATE = 0.2;

/** A secret's presence only — its value is never read into the response. */
function configured(name: string, label: string, variable: string, purpose: string): HealthCheck {
  return process.env[variable]
    ? { id: name, name: label, status: 'operational', detail: `${variable} is set.` }
    : { id: name, name: label, status: 'not_configured', detail: `${variable} is not set — ${purpose}.` };
}

async function databaseCheck(): Promise<HealthCheck> {
  const started = Date.now();
  try {
    await dbConnect();
    await mongoose.connection.db!.admin().ping();
    const latencyMs = Date.now() - started;
    return {
      id: 'database', name: 'Database (MongoDB)', latencyMs,
      status: latencyMs > SLOW_DB_MS ? 'degraded' : 'operational',
      detail: latencyMs > SLOW_DB_MS ? `Responding slowly (${latencyMs} ms).` : `Responding in ${latencyMs} ms.`,
    };
  } catch (error) {
    return { id: 'database', name: 'Database (MongoDB)', status: 'down', detail: error instanceof Error ? error.message : 'Ping failed.', latencyMs: Date.now() - started };
  }
}

/** Live health of the platform: dependency checks, configuration and recent error rates. */
export async function getSystemHealth() {
  const database = await databaseCheck();
  const hourAgo = new Date(Date.now() - 3_600_000);
  const dayAgo = new Date(Date.now() - 86_400_000);

  const [hour, day, recentFailures] = database.status === 'down'
    ? [null, null, []]
    : await Promise.all([
        AuditLog.aggregate([{ $match: { createdAt: { $gte: hourAgo } } }, { $group: { _id: null, total: { $sum: 1 }, failures: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, 1, 0] } }, avgMs: { $avg: '$durationMs' } } }]),
        AuditLog.aggregate([{ $match: { createdAt: { $gte: dayAgo } } }, { $group: { _id: null, total: { $sum: 1 }, failures: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, 1, 0] } }, avgMs: { $avg: '$durationMs' } } }]),
        AuditLog.find({ outcome: 'failure', createdAt: { $gte: dayAgo } }).sort({ createdAt: -1 }).limit(8).lean(),
      ]);

  const lastHour = hour?.[0];
  const errorRate = lastHour?.total ? lastHour.failures / lastHour.total : 0;
  const api: HealthCheck = database.status === 'down'
    ? { id: 'api', name: 'API', status: 'degraded', detail: 'Running, but the database is unreachable.' }
    : {
        id: 'api', name: 'API',
        status: errorRate > DEGRADED_ERROR_RATE && (lastHour?.total ?? 0) >= 5 ? 'degraded' : 'operational',
        detail: lastHour?.total ? `${(errorRate * 100).toFixed(1)}% of ${lastHour.total} actions failed in the last hour.` : 'No user actions in the last hour.',
      };

  const summarise = (row: { total: number; failures: number; avgMs: number | null } | undefined) =>
    ({ total: row?.total ?? 0, failures: row?.failures ?? 0, avgMs: row?.avgMs == null ? null : Math.round(row.avgMs) });

  return {
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    checks: [
      api,
      database,
      configured('auth', 'Authentication', 'JWT_SECRET', 'sign-in will not work'),
      configured('ai', 'AI (Google Gemini)', 'GOOGLE_API_KEY', 'AI features need an organization-supplied key'),
      configured('encryption', 'Secret encryption', 'ENCRYPTION_KEY', 'stored API keys and Google tokens cannot be encrypted'),
      configured('email', 'Email delivery (Brevo)', 'BREVO_API_KEY', 'password reset and notification emails will not send'),
    ],
    activity: { lastHour: summarise(lastHour), lastDay: summarise(day?.[0]) },
    recentFailures: recentFailures.map((entry) => ({
      id: String(entry._id), action: entry.action, path: entry.path, method: entry.method, statusCode: entry.statusCode,
      actorName: entry.actorName, createdAt: new Date(entry.createdAt).toISOString(),
    })),
  };
}

export type SystemHealth = Awaited<ReturnType<typeof getSystemHealth>>;
