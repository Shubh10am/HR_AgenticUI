import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/blog';
import LegalDocument, { type LegalSection } from '../components/legal-document';

export const metadata: Metadata = {
  title: 'Terms of Service | HR Streamline AI',
  description: 'The terms for using HR Streamline AI: accounts, acceptable use, your content, AI features, connected services, termination and liability.',
  alternates: { canonical: `${SITE_URL}/legal/terms` },
};

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of terms',
    body: (
      <>
        <p>By accessing or using the HR Streamline AI services (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.</p>
        <p>If you use the Service on behalf of an organization, you confirm that you are authorized to accept these terms for that organization.</p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <>
        <p>You are responsible for safeguarding your account and for any activities or actions under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
        <p>Organization administrators are responsible for the users they add, the roles they assign and keeping user access up to date — for example removing people who leave the organization.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service in violation of any law, including employment, anti-discrimination and data-protection laws.</li>
          <li>Upload content you do not have the right to share, or that is unlawful, harmful or infringing.</li>
          <li>Upload sensitive personal information — such as health or medical information — into AI features or the Knowledge Base.</li>
          <li>Attempt to access another organization&apos;s data, or probe, scan or disrupt the Service.</li>
          <li>Reverse engineer the Service or use it to build a competing product.</li>
          <li>Use the Service to send spam or unsolicited messages.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your content',
    body: (
      <>
        <p>The Service allows you to post, link, store, share and otherwise make available certain information, text or other material (&quot;Content&quot;). You are responsible for the Content that you post on or through the Service, including its legality, reliability and appropriateness.</p>
        <p>You keep ownership of your Content. You give us permission to host, process and display it only as needed to provide and improve the Service for you. How we handle personal information is described in our <Link href="/legal/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
  {
    id: 'ai-features',
    title: 'AI features',
    body: (
      <>
        <p>The Service includes AI features that generate drafts, answers, summaries and scores. AI output can be incomplete or wrong, so:</p>
        <ul>
          <li>Review AI output before relying on it or sending it to anyone.</li>
          <li>Do not use AI output as the sole basis for decisions about people, such as hiring, promotion, pay or termination. A qualified person must make those decisions.</li>
          <li>You are responsible for complying with laws that apply to your use of AI in employment, including any transparency or assessment requirements.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: 'Connected services',
    body: <p>Some features work with third-party services, such as Google (Gmail and Calendar) and Google&apos;s AI models. Your use of those services is also governed by their own terms and policies. We are not responsible for third-party services, and features that depend on them may change if those services change.</p>,
  },
  {
    id: 'preview-features',
    title: 'Guest mode and preview features',
    body: <p>Guest mode and features marked as &quot;preview&quot; are provided for evaluation and may show sample data, change or be removed. Do not rely on them for production use.</p>,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    body: <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of HR Streamline AI and its licensors.</p>,
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    body: (
      <>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        <p>You may stop using the Service at any time and delete your account from Settings. Administrators can delete their organization from Settings.</p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: <p>The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We do not warrant that the Service will be uninterrupted, error-free or that AI output will be accurate.</p>,
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: <p>To the extent permitted by law, HR Streamline AI will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, data or goodwill, arising from your use of the Service. Nothing in these terms limits liability that cannot be limited under applicable law.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to terms',
    body: <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days&apos; notice prior to any new terms taking effect.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      kind="terms"
      title="Terms of Service"
      summary="The rules for using HR Streamline AI — your responsibilities, ours, and how AI features should be used."
      lastUpdated="November 1, 2026"
      keyPoints={[
        'You own your content; we use it only to provide the Service.',
        'Keep your account secure and use the Service lawfully.',
        'AI output is a draft — a person must make decisions about people.',
        'We give at least 30 days’ notice before new terms take effect.',
      ]}
      sections={sections}
      contactEmail="legal@agentic-hr.in"
    />
  );
}
