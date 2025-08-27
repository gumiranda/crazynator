import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | CrazyNator',
  description: 'Terms and conditions for using the CrazyNator platform',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the CrazyNator platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to any part of these terms, you should not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Service Description</h2>
            <p>
              CrazyNator is an AI-assisted code generation platform that enables:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Converting natural language into functional web applications</li>
              <li>Real-time Next.js code generation with instant preview</li>
              <li>Isolated sandbox environment for code execution and editing</li>
              <li>Pre-built templates to accelerate development</li>
              <li>Credit system for usage control</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Registration and User Accounts</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">3.1 Eligibility</h3>
              <p>
                You must be at least 18 years old or have authorization from a legal guardian to use our service.
              </p>
              
              <h3 className="text-lg font-medium">3.2 Account Information</h3>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
              </p>
              
              <h3 className="text-lg font-medium">3.3 Information Accuracy</h3>
              <p>
                You agree to provide truthful, accurate, current and complete information during the registration process.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">4.1 Permitted Conduct</h3>
              <p>You may use the service to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create web applications for legitimate purposes</li>
                <li>Learn and experiment with modern web technologies</li>
                <li>Develop prototypes and MVPs</li>
                <li>Educational and research purposes</li>
              </ul>
              
              <h3 className="text-lg font-medium">4.2 Prohibited Conduct</h3>
              <p>It is expressly prohibited to use the service to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create illegal, defamatory, offensive or harmful content</li>
                <li>Violate third-party intellectual property rights</li>
                <li>Distribute malware, viruses or malicious code</li>
                <li>Engage in spam or phishing activities</li>
                <li>Circumvent or attempt to circumvent security systems</li>
                <li>Overload our infrastructure with abusive usage</li>
                <li>Resell or redistribute the service without authorization</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Credit System and Payments</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">5.1 Free Credits</h3>
              <p>
                New users receive 5 free credits valid for 30 days. Each project created consumes 1 credit.
              </p>
              
              <h3 className="text-lg font-medium">5.2 Paid Plans</h3>
              <p>
                We offer subscription plans with unlimited credits. Prices and conditions are available on our pricing page.
              </p>
              
              <h3 className="text-lg font-medium">5.3 Refund Policy</h3>
              <p>
                Refunds are processed according to our specific policy, available on the support page.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">6.1 User Ownership</h3>
              <p>
                You retain complete ownership of all code generated through our platform. We do not claim rights over your creations.
              </p>
              
              <h3 className="text-lg font-medium">6.2 Platform Ownership</h3>
              <p>
                The CrazyNator platform, including its source code, design, brand and technology, is our exclusive property and is protected by copyright laws.
              </p>
              
              <h3 className="text-lg font-medium">6.3 Usage License</h3>
              <p>
                We grant you a limited, non-exclusive and revocable license to use our platform in accordance with these terms.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection, use and protection of personal data is governed by our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>, which strictly follows the provisions of the General Data Protection Law (LGPD).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Service Availability</h2>
            <p>
              While we strive to maintain the service available 24/7, we do not guarantee uninterrupted availability. We may perform scheduled maintenance or face occasional technical disruptions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
            <p>
              Under no circumstances shall we be liable for direct, indirect, incidental, special, consequential or punitive damages arising from the use or inability to use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Significant changes will be communicated via email or platform notice at least 30 days in advance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Termination</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">11.1 User Termination</h3>
              <p>
                You may cancel your account at any time through the platform settings.
              </p>
              
              <h3 className="text-lg font-medium">11.2 Termination by Us</h3>
              <p>
                We may suspend or terminate your account in case of violation of these terms, with or without prior notice.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Applicable Law</h2>
            <p>
              These terms are governed by the laws of the Federative Republic of Brazil. Any disputes will be resolved in the competent courts of Brazil.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us through the channels available on our platform or visit our support page.
            </p>
          </section>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This document was last updated on {new Date().toLocaleDateString('en-US')}. 
            We recommend that you periodically review these terms to stay informed about our policies.
          </p>
        </div>

        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}