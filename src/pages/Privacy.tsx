import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Privacy() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Boss Spawns
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: November 24, 2025</p>
        </div>

        <div className="space-y-8 text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Introduction</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-3">
              <p>
                Welcome to EFT Boss Spawns ("we," "our," or "us"). We are committed to protecting 
                your privacy and being transparent about how we collect and use information. This 
                Privacy Policy explains our practices regarding data collection on eftboss.com (the "Site").
              </p>
              <p>
                By using our Site, you agree to the collection and use of information in accordance 
                with this policy.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Automatically Collected Information</h3>
                <p className="mb-2">When you visit our Site, we may automatically collect certain information, including:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Referring website addresses</li>
                  <li>IP address (anonymized where possible)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Local Storage</h3>
                <p>
                  We use your browser's local storage to save your preferences, such as:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2 mt-2">
                  <li>Notification preferences</li>
                  <li>Sound settings</li>
                  <li>Cached data for faster loading</li>
                  <li>Last viewed timestamps</li>
                </ul>
                <p className="mt-2 text-sm text-gray-400">
                  This data is stored locally on your device and is not transmitted to our servers.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cookies and Tracking Technologies</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <p>
                We use cookies and similar tracking technologies to track activity on our Site and 
                hold certain information. Cookies are files with a small amount of data which may 
                include an anonymous unique identifier.
              </p>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Types of Cookies We Use</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <strong className="text-gray-300">Essential Cookies:</strong> Required for the Site to function properly.
                  </li>
                  <li>
                    <strong className="text-gray-300">Analytics Cookies:</strong> Help us understand how visitors interact with our Site.
                  </li>
                  <li>
                    <strong className="text-gray-300">Advertising Cookies:</strong> Used by our advertising partners (Google AdSense) to serve relevant ads.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Google AdSense</h3>
                <p>
                  We use Google AdSense to display advertisements. Google may use cookies to serve 
                  ads based on your prior visits to our Site or other websites. You can opt out of 
                  personalized advertising by visiting{" "}
                  <a 
                    href="https://www.google.com/settings/ads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Google's Ads Settings
                  </a>.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Tarkov.dev API</h3>
                <p>
                  We fetch game data from the Tarkov.dev API. This is a third-party service that 
                  provides Escape from Tarkov game data. No personal information is shared with 
                  this service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Buy Me a Coffee</h3>
                <p>
                  We use Buy Me a Coffee for optional donations. If you choose to support us, 
                  your transaction is processed by Buy Me a Coffee according to their privacy policy.
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
            <div className="bg-gray-800/50 rounded-lg p-6">
              <p>
                We do not store personal data on our servers. Any data stored in your browser's 
                local storage remains on your device until you clear your browser data. Analytics 
                data is retained according to our analytics provider's policies.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                <li>Clear your browser's local storage at any time</li>
                <li>Disable cookies in your browser settings</li>
                <li>Opt out of personalized advertising</li>
                <li>Request information about what data we have about you</li>
              </ul>
              <p className="mt-3">
                To clear locally stored data, you can use your browser's developer tools or 
                clear your browsing data through your browser settings.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Children's Privacy</h2>
            <div className="bg-gray-800/50 rounded-lg p-6">
              <p>
                Our Site is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us.
              </p>
            </div>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to This Privacy Policy</h2>
            <div className="bg-gray-800/50 rounded-lg p-6">
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last 
                updated" date at the top of this policy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <div className="bg-gray-800/50 rounded-lg p-6">
              <p>
                If you have any questions about this Privacy Policy, please contact us through 
                our{" "}
                <a 
                  href="https://discord.gg/3dFmr5qaJK" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Discord server
                </a>.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-700 mt-12 pt-6 flex flex-wrap gap-4 justify-center text-sm text-gray-400">
          <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          <span>•</span>
          <Link to="/about" className="hover:text-purple-400 transition-colors">About</Link>
          <span>•</span>
          <a href="https://discord.gg/3dFmr5qaJK" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Discord</a>
        </div>
      </div>
    </div>
  );
}
