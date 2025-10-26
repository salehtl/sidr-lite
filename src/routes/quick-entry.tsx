import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import QuickEntryForm from '../components/QuickEntryForm'
import BatchEntryMode from '../components/BatchEntryMode'
import PersonCard from '../components/PersonCard'
import KeyboardShortcutHelp from '../components/KeyboardShortcutHelp'
import ProgressTracker from '../components/ProgressTracker'
import RecentAdditions from '../components/RecentAdditions'
// Removed NextStepsSuggestion import
import DataQualityBadge from '../components/DataQualityBadge'
import WarningToast from '../components/WarningToast'
import { HelpCircle, Users, Table } from 'lucide-react'

export const Route = createFileRoute('/quick-entry')({
  component: QuickEntryScreen,
})

function QuickEntryScreen() {
  const [showHelp, setShowHelp] = useState(false)
  const [entryMode, setEntryMode] = useState<'single' | 'batch'>('single')
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Entry</h1>
            <p className="text-gray-600">
              Add family members with explicit relationships. Use keyboard shortcuts for speed.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DataQualityBadge />
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setEntryMode('single')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  entryMode === 'single' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={16} />
                Single Entry
              </button>
              <button
                onClick={() => setEntryMode('batch')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  entryMode === 'batch' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table size={16} />
                Batch Entry
              </button>
            </div>
            
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HelpCircle size={16} />
              Keyboard Shortcuts
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Form - Takes up 2 columns on larger screens */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {entryMode === 'single' ? 'Add Person' : 'Batch Entry'}
                {entryMode === 'single' && (
                  <span className="text-sm text-gray-500 font-normal">(⌘S, ⌘C, ⌘P, ⌘B)</span>
                )}
              </h2>
              {entryMode === 'single' ? <QuickEntryForm /> : <BatchEntryMode />}
            </div>
            
            {/* Progress and Recent Additions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProgressTracker />
              <RecentAdditions />
            </div>
            
            {/* Next Steps Suggestions section removed */}
          </div>
          
          {/* Family Overview - Takes up 1 column */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Family Overview</h2>
              <PersonCard />
            </div>
          </div>
        </div>
      </div>
      
      <KeyboardShortcutHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      {/* Toast Notifications */}
      <WarningToast />
    </div>
  )
}
