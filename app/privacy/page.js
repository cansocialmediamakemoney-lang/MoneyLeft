import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen px-5 py-10 max-w-2xl mx-auto"
      style={{ color: "var(--text-primary)" }}
    >
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-base font-semibold mb-8"
        style={{ color: "var(--accent-text)" }}
      >
        ← Back to Settings
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Privacy Policy
      </h1>
      <p className="text-base mb-8" style={{ color: "var(--text-tertiary)" }}>
        Last updated: April 29, 2026
      </p>

      <p className="text-lg leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
        MoneyLeft ("we", "our", or "us") respects your privacy and is committed to protecting your
        information. This Privacy Policy explains what data we collect, how we use it, and your rights.
      </p>

      <Section number="1" title="Information We Collect">
        <ul className="space-y-2">
          <li><strong style={{ color: "var(--text-primary)" }}>Account Information:</strong> email and authentication data</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Financial Data (User-Entered):</strong> income, bills, purchases, savings goals</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Usage Data:</strong> interactions to improve the app</li>
        </ul>
      </Section>

      <Section number="2" title="How We Use Your Information">
        <ul className="space-y-2">
          <li>Provide app functionality</li>
          <li>Calculate budgets, plans, and projections</li>
          <li>Improve user experience</li>
          <li>Respond to support requests</li>
        </ul>
        <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>We do not sell your data.</p>
      </Section>

      <Section number="3" title="Data Storage">
        <p>Data may be stored locally or in secure services like Supabase.</p>
      </Section>

      <Section number="4" title="Third-Party Services">
        <p>We may use services like Supabase for authentication.</p>
      </Section>

      <Section number="5" title="Data Sharing">
        <p>We do not sell or rent your data.</p>
      </Section>

      <Section number="6" title="Your Rights">
        <p>You may request access or deletion of your data.</p>
      </Section>

      <Section number="7" title="Data Retention">
        <p>We retain data only as long as needed.</p>
      </Section>

      <Section number="8" title="Children's Privacy">
        <p>Not intended for users under 13.</p>
      </Section>

      <Section number="9" title="Changes">
        <p>We may update this policy.</p>
      </Section>

      <Section number="10" title="Contact">
        <p>
          Questions? Email us at{" "}
          <a
            href="mailto:moneyleft.support@gmail.com"
            style={{ color: "var(--accent-text)" }}
          >
            moneyleft.support@gmail.com
          </a>
        </p>
      </Section>

      <p
        className="text-center text-sm mt-10 pb-4"
        style={{ color: "var(--text-tertiary)" }}
      >
        MoneyLeft · Made with care
      </p>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <div className="mb-8">
      <h2
        className="text-xl sm:text-2xl font-bold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {number}. {title}
      </h2>
      <div
        className="text-lg leading-relaxed space-y-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>
    </div>
  );
}
