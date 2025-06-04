
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKeyFromEnv = process.env.GOOGLE_API_KEY;

if (!apiKeyFromEnv) {
  console.warn(
    "WARNING: GOOGLE_API_KEY is not set in environment variables. " +
    "AI features will likely not function correctly. " +
    "Please set this key in your .env.local file (e.g., GOOGLE_API_KEY=your_api_key_here) " +
    "and restart the server. You can manage the key you intend to use for this purpose " +
    "via the application's Settings page, which will guide you on adding it to .env.local."
  );
}

// The googleAI() plugin will automatically look for GOOGLE_API_KEY in the environment
// if no apiKey option is provided to it.
// Providing it explicitly if available from env for clarity.
// If apiKeyFromEnv is undefined here, googleAI() will still perform its own environment check.
export const ai = genkit({
  plugins: [
    googleAI(apiKeyFromEnv ? { apiKey: apiKeyFromEnv } : undefined)
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for the application
});

if (apiKeyFromEnv) {
  console.log("Genkit initialized. Google AI plugin is configured using GOOGLE_API_KEY from environment variables.");
} else {
  console.log("Genkit initialized. Google AI plugin will attempt to find GOOGLE_API_KEY from environment variables on its own, or AI operations may fail if not found/configured.");
}
