import { z } from 'genkit';

/** Shared rule for every hiring flow: judge job-relevant evidence only, and stay advisory. */
export const FAIR_HIRING_RULES = `Fair-hiring rules (always follow):
- Judge only job-relevant evidence: skills, experience, achievements, qualifications the role actually needs.
- Ignore and never mention name, gender, age, date of birth, photo, nationality, ethnicity, religion, marital or family status, disability, health, or address. Do not infer them.
- Do not penalise career gaps or non-traditional backgrounds by themselves.
- Your output is advice for a human recruiter, who makes every decision.`;

export const ScreenCandidateInputSchema = z.object({
  jobDescription: z.string().min(20).max(20000).describe('The job description to screen against.'),
  resumeText: z.string().min(20).max(30000).describe('The candidate resume as plain text.'),
  userId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
});

export const ScreenCandidateOutputSchema = z.object({
  candidateLabel: z.string().describe('The candidate name as written at the top of the resume, or "Candidate" if none. Used only as a label.'),
  currentTitle: z.string().describe('Most recent job title, or "" if unclear.'),
  yearsExperience: z.number().describe('Approximate total years of relevant professional experience.'),
  matchScore: z.number().min(0).max(100).describe('How well the resume meets the job requirements, 0-100.'),
  recommendation: z.enum(['advance', 'maybe', 'decline']).describe('advance ≥ 75 with no missing must-have; maybe 50-74 or one gap; decline otherwise.'),
  summary: z.string().describe('Two sentences on fit, citing evidence from the resume.'),
  matchedRequirements: z.array(z.string()).describe('Job requirements clearly evidenced in the resume (short phrases).'),
  missingRequirements: z.array(z.string()).describe('Important requirements with no evidence in the resume (short phrases).'),
  followUpQuestions: z.array(z.string()).describe('2-3 questions a recruiter should ask to close the gaps.'),
});

export const InterviewKitInputSchema = z.object({
  jobDescription: z.string().min(20).max(20000),
  candidateSummary: z.string().max(4000).optional().describe('Optional screening summary and gaps for this candidate.'),
  rounds: z.array(z.enum(['screening', 'technical', 'behavioural', 'culture-values', 'case-study', 'hiring-manager'])).min(1).max(5),
  questionsPerRound: z.number().int().min(2).max(8),
  userId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
});

export const InterviewKitOutputSchema = z.object({
  rounds: z.array(z.object({
    name: z.string(),
    durationMinutes: z.number(),
    goal: z.string().describe('What this round must find out.'),
    questions: z.array(z.object({
      question: z.string(),
      lookFor: z.string().describe('What a strong answer includes.'),
      redFlag: z.string().describe('What would be a concern.'),
    })),
  })),
  scorecard: z.array(z.object({
    competency: z.string(),
    description: z.string().describe('What 5/5 looks like for this competency.'),
  })).describe('4-6 competencies to rate 1-5 after the interview.'),
});
