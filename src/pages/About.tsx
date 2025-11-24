import { Link } from "react-router-dom";
import { ArrowLeft, Users, Database, Bell, GitCompare, Shield, Swords } from "lucide-react";

export function About() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            About EFT Boss Spawns
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your comprehensive resource for tracking boss spawn chances in Escape from Tarkov
          </p>
        </div>

        {/* What is this site */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-400" />
            What is EFT Boss Spawns?
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">
              EFT Boss Spawns is a community-driven tool that provides real-time information about 
              boss spawn chances in Escape from Tarkov. We aggregate data from the official game API 
              and community sources to give you the most accurate and up-to-date spawn information available.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Whether you're hunting for Killa in Interchange, avoiding Reshala on Customs, or tracking 
              the Goons across multiple maps, our tool helps you plan your raids more effectively by 
              knowing exactly what to expect.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <Swords className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">PVP Mode Tracking</h3>
              </div>
              <p className="text-gray-400 text-sm">
                View current boss spawn chances for standard PVP raids. Updated in real-time 
                as Battlestate Games adjusts spawn rates.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">PVE Mode Tracking</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Separate tracking for PVE mode spawn rates, which often differ from PVP. 
                Perfect for planning your offline or co-op raids.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <GitCompare className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Compare Mode</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Side-by-side comparison of PVP and PVE spawn rates. Quickly identify 
                differences between game modes to optimize your strategy.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Change Notifications</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Get notified when spawn rates change. Enable browser notifications to 
                stay informed about updates without constantly checking.
              </p>
            </div>
          </div>
        </section>

        {/* Boss Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Tarkov Bosses
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              Escape from Tarkov features numerous AI bosses, each with unique behaviors, 
              spawn locations, and loot tables:
            </p>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Reshala</strong> - Customs (Dorms, Gas Station, Stronghold)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Killa</strong> - Interchange (Mall)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Glukhar</strong> - Reserve (Various locations)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Shturman</strong> - Woods (Sawmill)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Sanitar</strong> - Shoreline (Resort, Pier, Cottages)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Tagilla</strong> - Factory, Interchange</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Kaban</strong> - Streets of Tarkov (Lexos)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>The Goons</strong> - Roaming (Multiple maps)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Zryachiy</strong> - Lighthouse (Island)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-gray-300"><strong>Kollontay</strong> - Streets, Ground Zero</span>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Data Sources</h2>
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-3">
            <p className="text-gray-300">
              Our data is sourced from multiple reliable sources:
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-gray-300">Tarkov.dev API</strong> - Primary data source for spawn information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-gray-300">Community Reports</strong> - Verified player observations and data mining</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-gray-300">Official Announcements</strong> - Battlestate Games patch notes and events</span>
              </li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              Data is refreshed every 5 minutes to ensure you have the latest information.
            </p>
          </div>
        </section>

        {/* Community */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Join Our Community</h2>
          <div className="bg-gradient-to-r from-purple-900/50 to-gray-800/50 rounded-lg p-6 border border-purple-700/30">
            <p className="text-gray-300 mb-4">
              Join our Discord community to discuss boss spawns, share strategies, and get 
              real-time updates from fellow Tarkov players.
            </p>
            <a
              href="https://discord.gg/3dFmr5qaJK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 256 199" fill="currentColor">
                <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
              </svg>
              Join Discord
            </a>
          </div>
        </section>

        {/* Footer Links */}
        <div className="border-t border-gray-700 pt-6 flex flex-wrap gap-4 justify-center text-sm text-gray-400">
          <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <a href="https://discord.gg/3dFmr5qaJK" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Discord</a>
        </div>
      </div>
    </div>
  );
}
