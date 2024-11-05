import { DataMode } from '@/types'

interface ModeToggleProps {
  mode: DataMode
  onChange: (mode: DataMode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg w-full sm:w-auto">
      <button
        onClick={() => onChange('regular')}
        className={`
          px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
          ${mode === 'regular' 
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }
        `}
      >
        PvP
      </button>
      <button
        onClick={() => onChange('pve')}
        className={`
          px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
          ${mode === 'pve' 
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }
        `}
      >
        PvE
      </button>
      <button
        onClick={() => onChange('compare')}
        className={`
          px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
          ${mode === 'compare' 
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }
        `}
      >
        Compare
      </button>
      <button
        onClick={() => onChange('changes')}
        className={`
          px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
          ${mode === 'changes' 
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }
        `}
      >
        Changes
      </button>
    </div>
  )
} 