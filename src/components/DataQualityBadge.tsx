import { useState, useRef, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { validateTreeNodes } from '../utils/treeValidation'
import { checkWarnings } from '../store/validators'
import { useWarningTiming } from '../hooks/useWarningTiming'
import { Bell, UserX, Baby, Heart, AlertTriangle, X, ChevronDown } from 'lucide-react'

export default function DataQualityBadge() {
  const { data } = useFamilyTreeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { shouldSuppressWarnings, isActivelyCreating } = useWarningTiming()
  
  const validation = validateTreeNodes(data)
  const warningData = checkWarnings(data)
  
  // Don't show warnings if there are critical errors
  if (!validation.isValid) {
    return null
  }
  
  if (shouldSuppressWarnings) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Building tree...</span>
      </div>
    )
  }
  
  // Collect all warnings
  const warnings = []
  
  // Isolated persons warning
  const isolatedPersons = Object.keys(validation.nodeErrors).filter(personId => 
    validation.nodeErrors[personId].some(error => 
      error.includes('not connected to the family tree')
    )
  )
  
  if (isolatedPersons.length > 0) {
    warnings.push({
      type: 'isolated-persons',
      icon: UserX,
      title: 'Isolated Persons',
      message: `${isolatedPersons.length} person(s) not connected to family tree`,
      severity: 'warning',
      count: isolatedPersons.length
    })
  }
  
  // Orphaned children warning
  if (warningData.orphanedChildren.length > 0) {
    warnings.push({
      type: 'orphaned-children',
      icon: Baby,
      title: 'Potentially Orphaned',
      message: `${warningData.orphanedChildren.length} person(s) may have lost parents`,
      severity: 'info',
      count: warningData.orphanedChildren.length
    })
  }
  
  // Auto-terminated marriages warning
  if (warningData.autoTerminatedMarriages.length > 0) {
    warnings.push({
      type: 'auto-terminated',
      icon: Heart,
      title: 'Auto-Terminated Marriages',
      message: `${warningData.autoTerminatedMarriages.length} marriage(s) terminated but have children`,
      severity: 'info',
      count: warningData.autoTerminatedMarriages.length
    })
  }
  
  // General validation warnings
  if (validation.warnings.length > 0) {
    warnings.push({
      type: 'general-warnings',
      icon: AlertTriangle,
      title: 'Data Quality Issues',
      message: validation.warnings.join(', '),
      severity: 'info',
      count: validation.warnings.length
    })
  }
  
  // Filter out dismissed warnings
  const activeWarnings = warnings.filter(w => !dismissedWarnings.includes(w.type))
  const totalCount = activeWarnings.reduce((sum, w) => sum + w.count, 0)
  
  if (totalCount === 0) {
    return null
  }
  
  const handleDismiss = (warningType: string) => {
    setDismissedWarnings(prev => [...prev, warningType])
  }
  
  const handleDismissAll = () => {
    setDismissedWarnings(warnings.map(w => w.type))
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
      >
        <Bell size={16} className="text-blue-600" />
        <span className="text-blue-800 font-medium">
          {totalCount} warning{totalCount !== 1 ? 's' : ''}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Data Quality</h3>
              <button
                onClick={handleDismissAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Dismiss All
              </button>
            </div>
            
            <div className="space-y-3">
              {activeWarnings.map((warning, index) => {
                const IconComponent = warning.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <IconComponent 
                      className={`mt-0.5 flex-shrink-0 ${
                        warning.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} 
                      size={16} 
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {warning.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {warning.message}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(warning.type)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
