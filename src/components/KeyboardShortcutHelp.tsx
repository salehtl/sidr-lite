import { X } from 'lucide-react'

interface KeyboardShortcutHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutHelp({ isOpen, onClose }: KeyboardShortcutHelpProps) {
  if (!isOpen) return null
  
  const shortcuts = [
    { key: '⌘S', description: 'Add as spouse' },
    { key: '⌘C', description: 'Add as child' },
    { key: '⌘P', description: 'Add as parent' },
    { key: '⌘B', description: 'Add as sibling' },
    { key: '⌘Enter', description: 'Submit form' },
    { key: 'Esc', description: 'Clear form' },
    { key: '/', description: 'Focus search' },
    { key: '↑↓', description: 'Navigate options' },
    { key: 'Enter', description: 'Select option' },
    { key: 'Tab', description: 'Next field' },
  ]
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Relationship Shortcuts</h3>
              <div className="space-y-2">
                {shortcuts.slice(0, 4).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Form Shortcuts</h3>
              <div className="space-y-2">
                {shortcuts.slice(4, 7).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Navigation</h3>
              <div className="space-y-2">
                {shortcuts.slice(7).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">?</kbd> anywhere to open this help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
