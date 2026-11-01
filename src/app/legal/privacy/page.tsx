import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/blog';
import LegalDocument, { type LegalSection } from '../components/legal-document';

export const metadata: Metadata = {
  title: 'Privacy Policy | HR Streamline AI',
  description: 'How HR Streamline AI collects, uses, shares and protects personal data, including employee records, Google data and AI processing — and your choices.',
  alternates: { canonical: `${SITE_URL}/legal/privacy` },
};

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Who we are and what this covers',
    body: (
      <>
        <p>This Privacy Policy explains how HR Streamline AI (&quot;we&quot;, &quot;us&quot;) handles personal information when you visit our website or use the HR Streamline AI platform (the &quot;Service&quot;).</p>
        <p>Organizations use the Service to manage their own people. When an organization adds information about its employees or candidates, the organization decides why and how that information is used, and we process it on the organization&apos;s behalf. Employees with questions about their data should contact their employer first.</p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account details</strong> — name, email address, role and organization details when you register or are added by an administrator.</li>
          <li><strong>Employee records</strong> — information your organization adds, such as names, emails, departments and roles.</li>
          <li><strong>Attendance and leave</strong> — clock-in and clock-out times, leave requests and correction requests.</li>
          <li><strong>Content you create or upload</strong> — documents in the Knowledge Base, community posts and comments, support tickets, and text you enter into AI features.</li>
          <li><strong>Communications with us</strong> — contact forms, demo requests and support messages.</li>
        </ul>
        <h3>Information from connected services</h3>
        <ul>
          <li><strong>Google</strong> — if you connect a Google account, we access your Gmail messages and Google Calendar events with the permissions you approve, so you can read, reply to and manage email inside the Service.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li><strong>Technical data</strong> — such as IP address, browser type and device information, used to operate and secure the Service.</li>
          <li><strong>Usage data</strong> — aggregate information about how pages are used, including AI feature usage for your organization&apos;s usage reports.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How we use information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain and improve the Service.</li>
          <li>Authenticate users and keep accounts and organizations secure.</li>
          <li>Process transactions and send related information.</li>
          <li>Send technical notices, updates, security alerts and support messages.</li>
          <li>Respond to comments, questions and requests and provide customer service.</li>
          <li>Monitor and analyze trends, usage and activities in connection with the Service.</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-features',
    title: 'AI features',
    body: (
      <>
        <p>Some features use artificial intelligence, such as drafting email replies, answering questions from your Knowledge Base, generating job descriptions and analyzing resumes. To provide them, the text you submit — and relevant passages from your organization&apos;s Knowledge Base — is sent to our AI provider, Google (Gemini), for processing.</p>
        <ul>
          <li>AI output is a draft for you to review. The Service does not send emails or make decisions about people automatically.</li>
          <li>Knowledge Base searches are limited to your own organization.</li>
          <li>Organizations may use their own Google AI key, in which case processing is under that organization&apos;s Google account.</li>
          <li>Please do not enter or upload sensitive personal information — such as health or medical information or individual employee records — into AI features or the Knowledge Base.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'How we share information',
    body: (
      <>
        <p>We do not sell personal information. We do not share personal information with third parties except in the following circumstances or as otherwise described in this Privacy Policy:</p>
        <ul>
          <li><strong>Service providers</strong> who need access to carry out work on our behalf — for example cloud hosting, email delivery, website analytics and AI processing (Google).</li>
          <li><strong>Services you connect</strong>, such as Google, when you choose to link them.</li>
          <li><strong>Within your organization</strong> — information is visible to other users of your organization according to their roles.</li>
          <li><strong>Legal reasons</strong> — in response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process.</li>
          <li><strong>Protection</strong> — if we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property and safety of HR Streamline AI or others.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'browser-storage',
    title: 'Cookies and browser storage',
    body: (
      <>
        <p>We use your browser&apos;s storage to keep you signed in and to remember preferences, such as whether you have completed the product tour or dismissed a tip. We also use website analytics (Vercel Analytics) to understand overall page usage. You can clear browser storage at any time; you will then need to sign in again.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention and deletion',
    body: (
      <>
        <p>We keep information for as long as your account or your organization&apos;s account is active, and afterwards only as long as needed for the purposes described here or to meet legal obligations.</p>
        <ul>
          <li>You can delete your own account from <strong>Settings</strong>.</li>
          <li>Organization administrators can delete the organization and its data from <strong>Settings</strong>.</li>
          <li>You can disconnect Google at any time from <strong>Integrations</strong>; this stops our access to your Gmail and Calendar.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights and choices',
    body: (
      <>
        <p>You have the right to access, correct or delete your personal information. Depending on where you live, you may also have rights to object to or restrict certain processing, to data portability, and to withdraw consent.</p>
        <p>You can manage much of your information by signing in to your account. For any other requests regarding your data, contact us at the address below. If your data was added by your employer, we may refer your request to them.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>We use technical and organizational measures to protect information. Read our <Link href="/legal/security">Security page</Link> for details. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.</p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>The Service is designed for organizations and their workforce. It is not directed to children, and we do not knowingly collect personal information from children.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>We may update this Privacy Policy from time to time. When we do, we will change the &quot;Last updated&quot; date above. We may also let you know through the Service or by email.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      kind="privacy"
      title="Privacy Policy"
      summary="How we collect, use, share and protect personal information when you use HR Streamline AI, and the choices you have."
      lastUpdated="November 1, 2026"
      keyPoints={[
        'We do not sell personal information.',
        'Your organization controls the employee data it adds to the platform.',
        'AI features send the text you submit to Google (Gemini) to generate drafts and answers.',
        'You can disconnect Google, delete your account, or ask us about your data at any time.',
      ]}
      sections={sections}
      contactEmail="privacy@agentic-hr.in"
    />
  );
}
