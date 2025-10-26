import { useFamilyTreeStore } from '../store/familyTreeStore'
import { validateTreeNodes } from '../utils/treeValidation'
import { checkWarnings } from '../store/validators'
import { AlertTriangle, UserX, Baby, Heart } from 'lucide-react'

export default function ValidationWarnings() {
  const { data } = useFamilyTreeStore()
  
  const validation = validateTreeNodes(data)
  // Note: Multiple roots is NOT a warning - it's normal for founding families
  
  // Don't show warnings if there are critical errors
  if (!validation.isValid) {
    return null
  }
  
  const warnings = []
  
  // Note: Multiple roots is NOT a warning - it's normal for founding families
  // (e.g., a husband and wife starting the tree will always be two roots)
  
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
      message: `${isolatedPersons.length} person(s) are not connected to the family tree.`,
      severity: 'warning'
    })
  }
  
  // Get detailed warning data
  const warningData = checkWarnings(data)
  
  // Orphaned children warning
  if (warningData.orphanedChildren.length > 0) {
    warnings.push({
      type: 'orphaned-children',
      icon: Baby,
      title: 'Potentially Orphaned Persons',
      message: `${warningData.orphanedChildren.length} person(s) may have lost their parents due to deletion.`,
      severity: 'info'
    })
  }
  
  // Auto-terminated marriages warning
  if (warningData.autoTerminatedMarriages.length > 0) {
    warnings.push({
      type: 'auto-terminated',
      icon: Heart,
      title: 'Auto-Terminated Marriages',
      message: `${warningData.autoTerminatedMarriages.length} marriage(s) were automatically terminated but have children.`,
      severity: 'info'
    })
  }
  
  // General validation warnings
  if (validation.warnings.length > 0) {
    warnings.push({
      type: 'general-warnings',
      icon: AlertTriangle,
      title: 'Data Quality Issues',
      message: validation.warnings.join(', '),
      severity: 'info'
    })
  }
  
  if (warnings.length === 0) {
    return null
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Data Quality Warnings
          </h3>
          <div className="space-y-2">
            {warnings.map((warning, index) => {
              const IconComponent = warning.icon
              return (
                <div key={index} className="flex items-start gap-2">
                  <IconComponent 
                    className={`mt-0.5 flex-shrink-0 ${
                      warning.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} 
                    size={16} 
                  />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {warning.title}
                    </p>
                    <p className="text-sm text-yellow-700">
                      {warning.message}
                    </p>
                    {/* Actionable guidance */}
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>What should I do?</strong>
                      <ul className="list-disc ml-4 mt-1">
                        {warning.type === 'isolated-persons' && (
                          <li>Add relationships for these people or remove them if they're not part of this family</li>
                        )}
                        {warning.type === 'orphaned-children' && (
                          <li>These people became roots after their parents were deleted. This is expected behavior.</li>
                        )}
                        {warning.type === 'auto-terminated' && (
                          <li>These marriages were automatically terminated when a spouse was deleted. This preserves family history.</li>
                        )}
                        {warning.type === 'general-warnings' && (
                          <li>Review the specific issues mentioned above and take appropriate action</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
