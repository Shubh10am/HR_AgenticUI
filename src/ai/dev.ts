import { config } from 'dotenv';
config();

import '@/ai/flows/draft-email-response.ts';
import '@/ai/flows/generate-job-description.ts';
import '@/ai/flows/summarize-github-activity.ts';
import '@/ai/flows/ai-interviewer.ts';