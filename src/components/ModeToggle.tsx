import { DataMode } from '@/types'

interface ModeToggleProps {
  mode: DataMode
  onChange: (mode: DataMode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg">
      <button
        onClick={() => onChange('regular')}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
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
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
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
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${mode === 'compare' 
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }
        `}
      >
        Compare
      </button>
    </div>
  )
} 