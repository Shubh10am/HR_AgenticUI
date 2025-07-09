export default function PrivacyPage() {
  const lastUpdated = "October 26, 2023";

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">Privacy Policy</h1>
        <p className="text-lg text-neutral-400">Last Updated: {lastUpdated}</p>
      </header>

      <div className="space-y-6 text-neutral-300">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-neutral-700 pb-2">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, manage your employees, or communicate with us. This may include your name, email address, organization details, and any other information you choose to provide. We also collect technical data automatically, such as IP address and browser type, to ensure the smooth operation of our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-neutral-700 pb-2">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send you related information.</li>
            <li>Send you technical notices, updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and requests and provide customer service.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-neutral-700 pb-2">3. Sharing of Information</h2>
          <p>
            We do not share your personal information with third parties except in the following circumstances or as otherwise described in this Privacy Policy:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., cloud hosting providers).</li>
            <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process.</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of HR Streamline AI or others.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-neutral-700 pb-2">4. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. You can manage your account information by logging into your account. For any requests regarding your data, please contact us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-neutral-700 pb-2">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@agentic-hr.in" className="text-primary hover:underline">privacy@agentic-hr.in</a>.
          </p>
        </section>
      </div>
    </article>
  );
}