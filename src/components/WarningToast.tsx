import { useState, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { validateTreeNodes } from '../utils/treeValidation'
import { checkWarnings } from '../store/validators'
import { useWarningTiming } from '../hooks/useWarningTiming'
import { Bell, X, ChevronRight } from 'lucide-react'

interface ToastWarning {
  type: string
  title: string
  message: string
  count: number
}

export default function WarningToast() {
  const { data } = useFamilyTreeStore()
  const [isVisible, setIsVisible] = useState(false)
  const [currentWarning, setCurrentWarning] = useState<ToastWarning | null>(null)
  const [shownWarnings, setShownWarnings] = useState<Set<string>>(new Set())
  const { shouldSuppressWarnings } = useWarningTiming()
  
  const validation = validateTreeNodes(data)
  const warningData = checkWarnings(data)
  
  // Don't show toast if there are critical errors or warnings are suppressed
  if (!validation.isValid || shouldSuppressWarnings) {
    return null
  }
  
  // Check for new warnings
  useEffect(() => {
    const warnings: ToastWarning[] = []
    
    // Isolated persons warning
    const isolatedPersons = Object.keys(validation.nodeErrors).filter(personId => 
      validation.nodeErrors[personId].some(error => 
        error.includes('not connected to the family tree')
      )
    )
    
    if (isolatedPersons.length > 0) {
      warnings.push({
        type: 'isolated-persons',
        title: 'Isolated Persons',
        message: `${isolatedPersons.length} person(s) not connected`,
        count: isolatedPersons.length
      })
    }
    
    // Orphaned children warning
    if (warningData.orphanedChildren.length > 0) {
      warnings.push({
        type: 'orphaned-children',
        title: 'Orphaned Persons',
        message: `${warningData.orphanedChildren.length} person(s) may have lost parents`,
        count: warningData.orphanedChildren.length
      })
    }
    
    // Auto-terminated marriages warning
    if (warningData.autoTerminatedMarriages.length > 0) {
      warnings.push({
        type: 'auto-terminated',
        title: 'Terminated Marriages',
        message: `${warningData.autoTerminatedMarriages.length} marriage(s) terminated`,
        count: warningData.autoTerminatedMarriages.length
      })
    }
    
    // Find first warning that hasn't been shown yet
    const newWarning = warnings.find(w => !shownWarnings.has(w.type))
    
    if (newWarning) {
      setCurrentWarning(newWarning)
      setIsVisible(true)
      setShownWarnings(prev => new Set([...prev, newWarning.type]))
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [data, validation, warningData, shownWarnings])
  
  const handleDismiss = () => {
    setIsVisible(false)
  }
  
  const handleViewDetails = () => {
    // This would open the DataQualityBadge dropdown
    // For now, just dismiss the toast
    setIsVisible(false)
  }
  
  if (!isVisible || !currentWarning) {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell size={16} className="text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {currentWarning.title}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {currentWarning.message}
            </p>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleViewDetails}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                View Details
                <ChevronRight size={12} />
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
