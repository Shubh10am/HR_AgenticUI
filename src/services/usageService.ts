'use server';

import dbConnect from '@/lib/mongodb';
import TokenUsageLog from '@/models/TokenUsageLog';
import type { GenerateResponse } from 'genkit/generate';

interface LogUsageParams {
  organizationId: string;
  employeeId: string;
  feature: string;
  usage: GenerateResponse['usage'];
}

/**
 * Logs token usage to the database. This is a fire-and-forget operation
 * and does not block the main AI flow response.
 * @param params - The parameters for logging token usage.
 */
export async function logTokenUsage(params: LogUsageParams): Promise<void> {
  const { organizationId, employeeId, feature, usage } = params;

  // Basic validation
  if (!organizationId || !employeeId || !feature || !usage) {
    console.warn('Token usage logging skipped due to missing parameters.');
    return;
  }
  
  // This function is async, but because it is not awaited by the caller,
  // it effectively becomes a "fire-and-forget" operation.
  try {
    await dbConnect();
    await TokenUsageLog.create({
      organizationId,
      employeeId,
      feature,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
    });
  } catch (error) {
    console.error('Failed to log token usage:', {
      error,
      organizationId,
      feature,
    });
  }
}
