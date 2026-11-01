import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { CHAT_MODEL } from '@/ai/models';

const apiKeyFromEnv = process.env.GOOGLE_API_KEY;

if (!apiKeyFromEnv) {
  console.warn(
    "WARNING: GOOGLE_API_KEY is not set in environment variables. " +
    "This will be used as a fallback key. If an organization does not have its " +
    "own key configured in Settings, AI features will fail."
  );
}

// The googleAI() plugin will automatically look for GOOGLE_API_KEY in the environment.
// This serves as the fallback configuration. Individual flow calls can override
// this by passing a user-specific API key.
export const ai = genkit({
  plugins: [
    googleAI(apiKeyFromEnv ? { apiKey: apiKeyFromEnv } : undefined)
  ],
  model: CHAT_MODEL, // Default model for the application
});

if (apiKeyFromEnv) {
  console.log("Genkit initialized with a fallback GOOGLE_API_KEY from environment variables.");
} else {
  console.log("Genkit initialized. No fallback GOOGLE_API_KEY found. AI features will rely solely on organization-specific keys.");
}
