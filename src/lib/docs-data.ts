
export interface DocPage {
  slug: string;
  title: string;
  description: string;
  content: string;
}

export interface DocSection {
  id: string;
  title: string;
  pages: DocPage[];
}

export const docsData: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    pages: [
      {
        slug: 'introduction',
        title: 'Introduction',
        description: 'An overview of HR Streamline AI and its core purpose.',
        content: `
          <h3 id="what-is-hr-streamline-ai">What is HR Streamline AI?</h3>
          <p>HR Streamline AI is an intelligent, all-in-one platform designed to automate and simplify your HR operations. From recruitment and onboarding to attendance tracking and internal communications, our platform leverages the power of AI to make your HR processes more efficient, data-driven, and user-friendly.</p>
          
          <h3 id="why-choose-us">Why Choose HR Streamline AI?</h3>
          <p>In today's fast-paced work environment, HR teams are often bogged down with repetitive administrative tasks. This leaves little time for strategic initiatives that truly impact employee experience and company growth. Our solution eliminates this bottleneck by automating routine tasks, providing intelligent insights, and unifying disparate systems into one cohesive dashboard.</p>
          
          <h3 id="core-features">Core Features</h3>
          <ul>
            <li><strong>AI-Powered Recruitment:</strong> Generate job descriptions, filter resumes with ATS scoring, and conduct initial AI-powered interviews.</li>
            <li><strong>Smart Email Assistance:</strong> Automatically generate draft responses to common employee inquiries and compose professional emails with AI help.</li>
            <li><strong>Unified Communications:</strong> Aggregate logs from platforms like Slack and Gmail to get a holistic view of team interactions.</li>
            <li><strong>Task Management:</strong> Organize projects, from onboarding checklists to company-wide initiatives, on a simple Kanban-style board.</li>
          </ul>
        `
      },
      {
        slug: 'quick-start-guide',
        title: 'Quick Start Guide',
        description: 'A step-by-step guide to setting up your account and getting started.',
        content: `
          <h3 id="step-1-registration">Step 1: Registration</h3>
          <p>Begin by registering your organization. Go to the <a href="/register">Register</a> page and fill in your organization's name, email domain, and create an administrator account. The administrator has full access to all features, including managing employees and billing.</p>

          <h3 id="step-2-managing-employees">Step 2: Managing Employees</h3>
          <p>Once logged in as an administrator, navigate to the <a href="/manage-employees">Manage Employees</a> page. Here, you can add new employees to your organization. Each employee will receive an email to set up their password and access their own dashboard.</p>

          <h3 id="step-3-integrations">Step 3: Connect Your Tools</h3>
          <p>Visit the <a href="/integrations">Integrations</a> page to connect your existing tools like Gmail, Slack, and Google Calendar. This is crucial for enabling features like the Gmail Inbox and Unified Communications.</p>

          <h3 id="step-4-explore-modules">Step 4: Explore the Modules</h3>
          <p>You're all set! Start exploring the different modules from the sidebar. A good place to start is the <a href="/recruitment">Recruitment</a> hub to generate your first AI job description, or the <a href="/email-assistance">Email Assistance</a> tool to see AI in action.</p>
        `
      },
    ]
  },
  {
    id: 'core-modules',
    title: 'Core Modules',
    pages: [
      {
        slug: 'recruitment',
        title: 'Recruitment Module',
        description: 'A deep dive into the AI-powered recruitment tools.',
        content: `
          <p>The Recruitment module is designed to streamline your entire hiring process, from creating a job post to screening candidates.</p>
          
          <h3 id="jd-generator">Job Description Generator</h3>
          <p>No more staring at a blank page. Simply provide a prompt with the job title, key skills, and experience level, and our AI will generate a comprehensive and professional job description. This ensures consistency and saves hours of writing time.</p>
          
          <h3 id="ats-score-check">ATS Score Check & Resume Analysis</h3>
          <p>Upload a candidate's resume (or paste the text) to get an instant analysis. Our AI provides:</p>
          <ul>
            <li>An <strong>ATS Score</strong> (0-100) estimating how well the resume would perform in an Applicant Tracking System.</li>
            <li>A concise <strong>overview</strong> of the candidate's profile.</li>
            <li>A list of crucial <strong>keywords</strong> identified in the resume.</li>
            <li>Highlighted <strong>strengths</strong> and actionable <strong>areas for improvement</strong>.</li>
          </ul>
          
          <h3 id="ai-interviewer">AI Interviewer</h3>
          <p>Conduct automated, unbiased initial screening interviews. Paste the job description and the candidate's resume, and the AI will conduct a text-based interview. It assesses the candidate's fit and provides a detailed transcript and a candidate fit score, allowing you to focus your time on the most promising applicants.</p>
        `
      },
      {
        slug: 'email-tools',
        title: 'Email Tools',
        description: 'Details on Email Assistance, Smart Drafting, and Gmail Inbox.',
        content: `
          <p>Email management is a core part of HR. Our platform offers several tools to make it easier.</p>
          
          <h3 id="email-assistance">Email Assistance</h3>
          <p>For incoming emails with common questions (e.g., leave requests, policy questions), you can paste the employee's query into the Email Assistance tool. The AI will generate several professional draft responses, which you can then use in the composer.</p>

          <h3 id="smart-drafting">Smart Drafting Composer</h3>
          <p>This is your all-purpose email composer. You can write emails from scratch or use the AI prompt to generate drafts for new announcements, like a company event or policy update. It's a powerful tool for proactive communication.</p>
          
          <h3 id="gmail-inbox">Gmail Inbox Integration</h3>
          <p>By connecting your Gmail account, you can manage your inbox directly within HR Streamline AI. This feature (currently in mock-up) will allow you to read, reply to, and categorize emails, using the AI tools seamlessly without switching tabs.</p>
        `
      },
    ],
  },
];
