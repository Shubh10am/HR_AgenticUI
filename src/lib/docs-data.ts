
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
          <p>HR Streamline AI is an intelligent, all-in-one platform designed to automate and simplify your HR operations. By leveraging advanced AI agents, our platform transforms routine tasks into efficient, automated workflows, allowing you to focus on what truly matters: your people.</p>
          
          <h3 id="why-choose-us">Why Choose HR Streamline AI?</h3>
          <p>In today's fast-paced work environment, HR teams are often burdened with repetitive administrative tasks. This leaves little time for strategic initiatives that drive company culture and employee growth. Our solution eliminates this bottleneck by providing intelligent assistants that handle everything from recruitment to internal communications, turning your HR department into a strategic powerhouse.</p>
          
          <h3 id="core-features">Core Features at a Glance</h3>
          <ul>
            <li><strong>AI-Powered Recruitment:</strong> Find the best talent faster with AI-generated job descriptions, intelligent resume screening, and automated initial interviews.</li>
            <li><strong>Smart Email Assistance:</strong> Instantly generate professional email drafts for common employee inquiries or compose new announcements using simple prompts.</li>
            <li><strong>Unified Communications:</strong> Get a 360-degree view of team interactions by aggregating logs from essential platforms like Slack and Gmail.</li>
            <li><strong>Automated Task Management:</strong> Organize complex projects, from employee onboarding to event planning, on a clear and collaborative Kanban board.</li>
          </ul>
        `
      },
      {
        slug: 'quick-start-guide',
        title: 'Quick Start Guide',
        description: 'A step-by-step guide to setting up your account and getting started.',
        content: `
          <h3 id="step-1-registration">Step 1: Register Your Organization</h3>
          <p>Your journey begins on the <a href="/register">Register</a> page. Fill in your organization's details and create the primary administrator account. This account will have full permissions to manage users, settings, and billing.</p>

          <h3 id="step-2-add-your-team">Step 2: Add Your Team</h3>
          <p>Navigate to the <a href="/manage-employees">Manage Employees</a> page from the sidebar. Here, you can add new employees individually or use the bulk upload feature to add your entire team at once. Each new employee will receive a welcome email with credentials to access their personalized dashboard.</p>

          <h3 id="step-3-connect-your-tools">Step 3: Connect Your Tools</h3>
          <p>The true power of HR Streamline AI is unlocked by connecting your existing tools. Visit the <a href="/integrations">Integrations</a> page to authorize access to services like Gmail, Slack, and Google Calendar. This enables features like the Gmail Inbox, AI reply generation, and unified communication logging.</p>

          <h3 id="step-4-explore-the-ai-modules">Step 4: Explore the AI Modules</h3>
          <p>You're all set! A great place to start is the <a href="/recruitment">Recruitment</a> hub. Try generating your first AI job description, or upload a resume to see the ATS analysis in action. You can also head to the <a href="/email-assistance">Email Assistance</a> tool to experience how our AI can handle routine inquiries.</p>
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
          <p>The Recruitment module is your command center for hiring. It leverages AI to streamline every step of the process, from creating a job post to screening candidates and conducting initial interviews.</p>
          
          <h3 id="jd-generator">AI Job Description Generator</h3>
          <p>Stop staring at a blank page. Provide our AI with a simple prompt—like a job title, key skills, and experience level—and it will generate a comprehensive, professional, and inclusive job description in seconds. This ensures consistency across your job postings and saves hours of writing time.</p>
          
          <h3 id="ats-score-check">ATS Score Check & AI Resume Analysis</h3>
          <p>Our resume analysis tool acts like a super-powered Applicant Tracking System (ATS). Upload a candidate's resume (or paste the text) to get an instant, in-depth analysis that includes:</p>
          <ul>
            <li>An <strong>ATS Score (0-100)</strong> that estimates how well the resume aligns with the job description and common screening criteria.</li>
            <li>A concise <strong>professional overview</strong> summarizing the candidate's experience and qualifications.</li>
            <li>A list of crucial <strong>keywords and technologies</strong> identified in the resume.</li>
            <li>Highlighted <strong>key strengths</strong> and actionable <strong>areas for improvement</strong> to help candidates and guide your screening process.</li>
          </ul>
          
          <h3 id="ai-interviewer">AI Interviewer</h3>
          <p>Automate your initial screening interviews to save time and reduce bias. Provide the job description and the candidate's resume, and our AI will conduct a structured, text-based interview. It assesses the candidate's fit based on their responses and provides you with a detailed transcript, a summary of their performance, and a final candidate fit score. This allows your team to focus its valuable time on the most promising applicants.</p>
        `
      },
      {
        slug: 'email-tools',
        title: 'Email Tools',
        description: 'Details on Email Assistance, Smart Drafting, and Gmail Inbox.',
        content: `
          <p>Email management is a core, yet time-consuming, part of HR. Our platform offers a suite of AI-powered tools to make it faster and more effective.</p>
          
          <h3 id="email-assistance">Email Assistance (Reactive)</h3>
          <p>This tool is designed for handling incoming emails. When an employee sends a common query (e.g., about leave policy, payroll, or benefits), simply paste their message into the Email Assistance tool. The AI will analyze the request and generate several distinct, professional draft responses, allowing you to reply accurately in seconds.</p>

          <h3 id="smart-drafting">Smart Drafting Composer (Proactive)</h3>
          <p>The Smart Drafting Composer is your go-to for creating new emails from scratch. Whether you're announcing a company-wide event, sending out a policy update, or crafting a project kickoff email, just provide a simple prompt. The AI will generate a well-structured, professional email that you can edit and send directly.</p>
          
          <h3 id="gmail-inbox">Integrated Gmail Inbox</h3>
          <p>By connecting your Gmail account via the <a href="/integrations">Integrations</a> page, you can bring your inbox directly into the HR Streamline AI dashboard. This allows you to read and reply to emails without ever leaving the platform. More importantly, you can use the AI Email Assistance and Smart Drafting tools seamlessly within your existing workflow, supercharging your productivity.</p>
        `
      },
    ],
  },
];
