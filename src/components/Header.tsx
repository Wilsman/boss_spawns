import { Calculator, Database } from "lucide-react";

export function Header() {
  return (
    <div className="mb-12">
      {/* Title Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Tarkov Boss Spawns
          </h1>
        </div>

        {/* Links Section */}
        <div className="flex flex-col space-y-3">
          {/* Existing Cultist Circle Link */}
          <a
            href="https://www.cultistcircle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-gray-800/50 rounded-lg
                     hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
                     border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
          >
            <Calculator className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:-rotate-12" />
            <span className="text-sm font-medium text-gray-300 transition-colors duration-300 sm:text-base group-hover:text-purple-400">
              Check out the Cultist Circle Calculator!
            </span>
            <Calculator className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
          </a>

          {/* New Tarkov.dev Attribution Link */}
          <a
            href="https://tarkov.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-gray-800/50 rounded-lg 
                     hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
                     border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
          >
            <Database className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-sm font-medium text-gray-300 transition-colors duration-300 sm:text-base group-hover:text-purple-400">
              Data provided by Tarkov.dev
            </span>
            <Database className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:-rotate-12" />
          </a>
        </div>
      </div>
    </div>
  );
}
