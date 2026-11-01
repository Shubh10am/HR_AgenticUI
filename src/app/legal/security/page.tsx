import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/blog';
import LegalDocument, { type LegalSection } from '../components/legal-document';

export const metadata: Metadata = {
  title: 'Security | HR Streamline AI',
  description: 'How HR Streamline AI protects your data: encryption, organization isolation, role-based access, AI data handling and how to report a vulnerability.',
  alternates: { canonical: `${SITE_URL}/legal/security` },
};

const sections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: <p>At HR Streamline AI, we take the security of your data seriously. This page outlines the measures we take to protect your information and ensure the integrity and availability of our services.</p>,
  },
  {
    id: 'encryption',
    title: 'Data encryption',
    body: (
      <ul>
        <li><strong>Encryption in transit:</strong> all data transmitted between your device and our servers is encrypted using industry-standard Transport Layer Security (TLS) 1.2 or higher.</li>
        <li><strong>Encryption at rest:</strong> all of your data, including database files and backups, is encrypted at rest using AES-256 encryption.</li>
        <li><strong>Application-level encryption:</strong> sensitive secrets, such as your organization&apos;s AI API key, are additionally encrypted with AES-256-GCM before being stored.</li>
        <li><strong>Passwords</strong> are never stored in plain text — only salted bcrypt hashes are kept.</li>
      </ul>
    ),
  },
  {
    id: 'isolation-and-access',
    title: 'Organization isolation and access control',
    body: (
      <>
        <ul>
          <li><strong>Organization isolation:</strong> your data is logically separated within our multi-tenant architecture and is only accessible to authenticated users from your organization. Searches, including AI Knowledge Base searches, are scoped to your organization using your verified sign-in — never a value sent by the browser.</li>
          <li><strong>Role-based access:</strong> what each person can see and change depends on their role (Admin, HR, Manager or Employee). Sensitive actions, such as managing employees, are restricted to administrators.</li>
          <li><strong>Sessions</strong> expire after one day, after which users sign in again.</li>
          <li><strong>Suspended organizations</strong> are blocked from the Service until reinstated.</li>
        </ul>
        <p>Access to our production environment is strictly limited to authorized personnel and is controlled through multi-factor authentication (MFA) and the principle of least privilege. We maintain detailed audit logs of all access to our systems.</p>
      </>
    ),
  },
  {
    id: 'connected-services',
    title: 'Connected services and AI',
    body: (
      <ul>
        <li><strong>Google:</strong> Gmail and Calendar are connected through Google&apos;s OAuth sign-in. You approve the permissions, and you can disconnect at any time from Integrations.</li>
        <li><strong>AI processing:</strong> text sent to AI features is processed by Google&apos;s Gemini models to generate drafts and answers. Output is always a draft for a person to review; nothing is sent automatically.</li>
        <li><strong>Uploaded documents:</strong> Knowledge Base files are converted to text in your browser before upload, and only Admins and HR can add or remove them.</li>
        <li><strong>Embedded email content</strong> is displayed in an isolated, script-free frame so it cannot affect the rest of the app.</li>
      </ul>
    ),
  },
  {
    id: 'compliance',
    title: 'Compliance',
    body: <p>Our infrastructure is hosted on leading cloud providers that are compliant with a wide range of international standards, including SOC 2, ISO 27001 and GDPR. We are actively working towards our own SOC 2 Type I compliance certification.</p>,
  },
  {
    id: 'vulnerability-management',
    title: 'Vulnerability management',
    body: <p>We regularly scan our applications and infrastructure for vulnerabilities. Critical patches are applied as soon as they become available. We also engage with independent third-party security experts to perform penetration tests on our systems.</p>,
  },
  {
    id: 'your-part',
    title: 'Your part in keeping data secure',
    body: (
      <ul>
        <li>Use a strong, unique password and change any initial password you were given.</li>
        <li>Remove users promptly when they leave your organization.</li>
        <li>Give people the lowest role they need.</li>
        <li>Keep sensitive personal and health information out of AI features and the Knowledge Base.</li>
        <li>Never share your organization&apos;s AI API key outside Settings.</li>
      </ul>
    ),
  },
  {
    id: 'reporting',
    title: 'Reporting a vulnerability',
    body: (
      <>
        <p>If you believe you have found a security vulnerability, please contact us immediately at <a href="mailto:security@agentic-hr.in">security@agentic-hr.in</a> with enough detail for us to reproduce it.</p>
        <p>When researching, please do not access, change or delete other people&apos;s data, do not disrupt the Service, and give us reasonable time to fix the issue before sharing it publicly. See also our <Link href="/legal/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
];

export default function SecurityPage() {
  return (
    <LegalDocument
      kind="security"
      title="Security"
      summary="How we protect your organization’s data — from encryption and isolation to access control and responsible disclosure."
      lastUpdated="November 1, 2026"
      keyPoints={[
        'Data is encrypted in transit (TLS 1.2+) and at rest (AES-256).',
        'Each organization’s data is isolated and visible only to its own users.',
        'Access follows roles, and sensitive secrets get an extra layer of encryption.',
        'Found a vulnerability? Email security@agentic-hr.in.',
      ]}
      sections={sections}
      contactEmail="security@agentic-hr.in"
    />
  );
}
