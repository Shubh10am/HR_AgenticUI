import { config } from 'dotenv';
config();

import '@/ai/flows/draft-email-response.ts';
import '@/ai/flows/generate-job-description.ts';
import '@/ai/flows/summarize-github-activity.ts';
import '@/ai/flows/ai-interviewer.ts';
import '@/ai/flows/copilot-chat-flow.ts'; // Added import for copilot chat
import '@/ai/flows/analyze-resume-flow.ts'; // Added import for resume analysis
