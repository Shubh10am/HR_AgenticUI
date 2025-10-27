
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
       {
        slug: 'community-hub',
        title: 'Community Hub',
        description: 'Engage with your team, share announcements, and foster company culture.',
        content: `
          <h3 id="a-central-place-for-culture">A Central Place for Culture</h3>
          <p>The Community Hub is a private social feed for your organization. It's designed to be the central place for company-wide announcements, team updates, and informal discussions, helping to build a stronger, more connected company culture, especially in remote or hybrid environments.</p>
          
          <h3 id="features">Features</h3>
          <ul>
            <li><strong>Create Posts:</strong> Authorized users (Admins, HR, and Managers) can create new posts with topics and subjects to share important information with the entire organization.</li>
            <li><strong>Likes and Comments:</strong> All employees can react to posts by liking them and can participate in discussions by adding comments, fostering a sense of community and engagement.</li>
            <li><strong>Real-time Updates:</strong> The feed updates in real-time, ensuring everyone has access to the latest news and conversations.</li>
            <li><strong>Moderation:</strong> Admins have moderation capabilities to ensure discussions remain professional and productive.</li>
          </ul>
        `
      },
      {
        slug: 'attendance-and-reporting',
        title: 'Attendance & Reporting',
        description: 'Track time, manage leave, and generate insightful reports.',
        content: `
          <h3 id="smart-clock-in">Smart Clock-in/Out System</h3>
          <p>Our simple and intuitive clock-in/out system allows employees to track their work hours with a single click. The system automatically calculates work duration and logs the data for payroll and reporting.</p>
          
          <h3 id="leave-management">AI-Assisted Leave Management</h3>
          <p>Employees can request leave through a simple form. Our AI assistant can even help draft the reason for leave based on a simple prompt, ensuring professionalism. Managers and HR admins get notified for approvals, and all approved leaves are automatically reflected in attendance reports.</p>
          
          <h3 id="powerful-reporting">Powerful Reporting</h3>
          <p>Go beyond simple logs. Our reporting dashboard visualizes attendance data, showing trends in tardiness, absenteeism, and hours worked. This helps you identify potential burnout or disengagement issues before they become critical.</p>
        `
      },
      {
        slug: 'unified-communications',
        title: 'Unified Communications',
        description: 'Aggregate all your team communication in one place.',
        content: `
          <h3 id="a-single-source-of-truth">A Single Source of Truth</h3>
          <p>In a hybrid work environment, conversations are fragmented across email, Slack, Teams, and more. Our Unified Communications Hub integrates with these platforms to pull all relevant communication logs into one searchable interface.</p>
          
          <h3 id="contextual-insights">Contextual Insights</h3>
          <p>Instead of jumping between apps, get a holistic view of team and project communications. This is invaluable for performance reviews, project management, and compliance. The AI can summarize long threads or find key decisions, saving you hours of searching.</p>
        `
      },
      {
        slug: 'knowledge-base',
        title: 'Knowledge Base',
        description: 'The central brain for your organization and the AI.',
        content: `
          <h3 id="your-organizations-brain">Your Organization's Brain</h3>
          <p>The Knowledge Base is where you store all your important company documents—employee handbooks, leave policies, IT setup guides, and more. It acts as the single source of truth for your entire organization.</p>
          
          <h3 id="powering-the-ai">Powering the AI</h3>
          <p>This module is critical for the platform's AI. When an employee asks the HR Copilot a question like "How many sick days do I get?", the AI securely queries the documents in your Knowledge Base to provide an accurate, context-aware answer based on <strong>your</strong> company's specific policies. Keeping this up-to-date ensures the AI remains a helpful and reliable resource.</p>
        `
      },
      {
        slug: 'task-management',
        title: 'Task Management',
        description: 'Organize workflows with a collaborative Kanban board.',
        content: `
          <h3 id="visualize-your-workflow">Visualize Your Workflow</h3>
          <p>Our built-in Task Management tool uses a Kanban-style board to help you visualize workflows for any process, from onboarding a new hire to planning a company event. Create columns for each stage of your process (e.g., To Do, In Progress, In Review, Done) and move tasks between them.</p>
          
          <h3 id="collaboration-and-accountability">Collaboration and Accountability</h3>
          <p>Assign tasks to team members, set due dates, add attachments, and leave comments. This ensures everyone knows their responsibilities and keeps projects on track. For HR, this is perfect for managing multi-step processes like recruitment pipelines or employee offboarding.</p>
        `
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    pages: [
      {
        slug: 'connecting-your-tools',
        title: 'Connecting Your Tools',
        description: 'Learn how to connect your favorite third-party services to unlock the full power of HR Streamline AI.',
        content: `
          <p>HR Streamline AI enhances your existing workflows by integrating directly with the tools your team already uses. Connecting your accounts is simple, secure, and unlocks powerful new capabilities.</p>
          
          <h3 id="google-suite">Google Suite (Gmail, Calendar, Meet, Workspace)</h3>
          <p><strong>Why connect?</strong> Integrating with Google is the most powerful way to enhance the platform. It enables the AI to read emails for context, generate replies, send emails on your behalf, and view your calendar for scheduling.</p>
          <p><strong>How to connect:</strong></p>
          <ol>
            <li>Navigate to the <a href="/integrations">Integrations</a> page.</li>
            <li>Click the "Connect" button on any Google-related service (e.g., Gmail, Calendar).</li>
            <li>You will be redirected to a Google authentication screen. Log in to the Google account you wish to use.</li>
            <li>Grant the requested permissions. We only ask for permissions necessary to provide our services, such as reading and sending emails or viewing calendar events.</li>
            <li>You will be redirected back to the platform, and the integration will be active.</li>
          </ol>
          
          <h3 id="slack">Slack</h3>
          <p><strong>Why connect?</strong> Receive real-time notifications about important HR events, such as new leave requests or completed interviews, directly in your Slack channels. Future updates will include slash commands to trigger HR actions from within Slack.</p>
          <p><strong>How to connect:</strong> On the Integrations page, click "Connect" for Slack. You will be prompted to choose a Slack workspace and authorize the HR Streamline AI app.</p>

          <h3 id="github">GitHub</h3>
          <p><strong>Why connect?</strong> For technical teams, integrating GitHub allows HR and managers to get AI-powered summaries of developer activity, track contributions, and link project progress to performance reviews without needing deep technical knowledge.</p>
          <p><strong>How to connect:</strong> Similar to other integrations, connect via the Integrations page and authorize access to the repositories you wish to monitor.</p>
        `
      }
    ]
  }
];
