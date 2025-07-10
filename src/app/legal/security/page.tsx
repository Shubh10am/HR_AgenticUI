
export default function SecurityPage() {
  const lastUpdated = "October 26, 2023";

  return (
    <article className="space-y-8 prose dark:prose-invert max-w-none">
      <header>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-foreground">Security Policy</h1>
        <p className="text-lg text-muted-foreground">Last Updated: {lastUpdated}</p>
      </header>
      
      <div className="space-y-6 text-foreground/80">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Introduction</h2>
          <p>
            At HR Streamline AI, we take the security of your data seriously. This Security Policy outlines the measures we take to protect your information and ensure the integrity and availability of our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Data Encryption</h2>
          <p>
            <strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using industry-standard Transport Layer Security (TLS) 1.2 or higher.
          </p>
          <p>
            <strong>Encryption at Rest:</strong> All of your data, including database files and backups, is encrypted at rest using AES-256 encryption. Sensitive information, such as API keys, undergoes an additional layer of application-level encryption before being stored.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Access Control</h2>
          <p>
            Access to our production environment is strictly limited to authorized personnel and is controlled through multi-factor authentication (MFA) and the principle of least privilege. We maintain detailed audit logs of all access to our systems.
          </p>
          <p>
            Your user data is logically separated within our multi-tenant architecture. Your organization's data is only accessible to authenticated users from your organization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Compliance</h2>
          <p>
            Our infrastructure is hosted on leading cloud providers that are compliant with a wide range of international standards, including SOC 2, ISO 27001, and GDPR. We are actively working towards our own SOC 2 Type I compliance certification.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Vulnerability Management</h2>
          <p>
            We regularly scan our applications and infrastructure for vulnerabilities. Critical patches are applied as soon as they become available. We also engage with independent third-party security experts to perform penetration tests on our systems.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold border-b border-border pb-2 text-foreground">Contact Us</h2>
          <p>
            If you have any questions about our security practices or believe you have found a security vulnerability, please contact us immediately at <a href="mailto:security@agentic-hr.in" className="text-primary hover:underline">security@agentic-hr.in</a>.
          </p>
        </section>
      </div>
    </article>
  );
}
