
export default function TermsPage() {
  const lastUpdated = "October 26, 2023";

  return (
    <article className="space-y-8 prose dark:prose-invert max-w-none">
      <header>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-foreground">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">Last Updated: {lastUpdated}</p>
      </header>

      <div className="space-y-6 text-foreground/80">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the HR Streamline AI services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">2. Your Account</h2>
          <p>
            You are responsible for safeguarding your account and for any activities or actions under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">3. Content</h2>
          <p>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, or other material ("Content"). You are responsible for the Content that you post on or through the service, including its legality, reliability, and appropriateness.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">4. Intellectual Property</h2>
          <p>
            The service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of HR Streamline AI and its licensors.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">6. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@agentic-hr.in" className="text-primary hover:underline">legal@agentic-hr.in</a>.
          </p>
        </section>
      </div>
    </article>
  );
}
