'use client';

const BUSY = /UNAVAILABLE|RESOURCE_EXHAUSTED|503|429|high demand|overloaded|rate limit/i;

/**
 * Runs an AI call, retrying up to twice when the provider is briefly busy (503/429).
 *
 * @throws A readable error once retries are used up, or the original error for anything else.
 */
export async function withAiRetry<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!BUSY.test(message)) throw error;
      if (attempt >= 2) throw new Error('The AI provider is busy right now. Please try again in a minute.');
      await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
    }
  }
}
