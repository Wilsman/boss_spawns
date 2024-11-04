import { Ghost } from 'lucide-react'

export function Header() {
  return (
    <div className="mb-12">
      {/* Title Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <img
            src="https://static-cdn.jtvnw.net/jtv_user_pictures/ca020585-dce5-46bd-a952-cac963a2aff4-profile_image-70x70.png"
            alt="Profile"
            className="w-12 h-12 rounded-full shadow-lg shadow-purple-500/20"
          />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Tarkov Boss Spawns
          </h1>
          <img
            src="https://static-cdn.jtvnw.net/jtv_user_pictures/ca020585-dce5-46bd-a952-cac963a2aff4-profile_image-70x70.png"
            alt="Profile"
            className="w-12 h-12 rounded-full shadow-lg shadow-purple-500/20"
          />
        </div>

        {/* Cultist Circle Link */}
        <a
          href="https://www.cultistcircle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-6 py-2.5 bg-gray-800/50 rounded-lg 
                   hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
                   border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
        >
          <Ghost className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:-rotate-12" />
          <span className="text-base font-medium text-gray-300 group-hover:text-purple-400 transition-colors duration-300">
            Check out the Cultist Circle Calculator!
          </span>
          <Ghost className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
        </a>
      </div>
    </div>
  )
} 