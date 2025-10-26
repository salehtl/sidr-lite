import type { FamilyTree } from '../types/domain'
import { validateHardInvariants, checkWarnings } from '../store/validators'

export interface TreeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  nodeErrors: Record<string, string[]>
}

export type NodeValidationStatus = 'valid' | 'warning' | 'error'

/**
 * Legacy function - now redirects to the new validation system.
 * This provides a simplified interface that matches the old API.
 * @deprecated Use validateHardInvariants and checkWarnings directly
 */
export function validateTreeNodes(data: FamilyTree): TreeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeErrors: Record<string, string[]> = {}
  
  // Run hard invariants validation
  const validationErrors = validateHardInvariants(data)
  if (validationErrors.length > 0) {
    errors.push(...validationErrors.map(e => e.message))
  }
  
  // Check warnings
  const warningData = checkWarnings(data)
  
  // Note: Multiple roots is NOT a warning - it's normal for founding families
  // (e.g., a husband and wife starting the tree will always be two roots)
  
  if (warningData.isolatedPersons.length > 0) {
    warnings.push(
      `${warningData.isolatedPersons.length} isolated person(s): ` +
      `These people have no recorded parents, spouses, or children. ` +
      `Consider adding relationships or removing them.`
    )
    warningData.isolatedPersons.forEach(personId => {
      nodeErrors[personId] = nodeErrors[personId] || []
      nodeErrors[personId].push('Person is isolated from the family tree')
    })
  }
  
  if (warningData.orphanedChildren.length > 0) {
    warnings.push(
      `${warningData.orphanedChildren.length} potentially orphaned person(s): ` +
      `These people are marked as roots but have families, ` +
      `which may indicate their parents were deleted.`
    )
    warningData.orphanedChildren.forEach(childId => {
      nodeErrors[childId] = nodeErrors[childId] || []
      nodeErrors[childId].push('Person may have lost parents due to deletion')
    })
  }
  
  if (warningData.autoTerminatedMarriages.length > 0) {
    warnings.push(
      `${warningData.autoTerminatedMarriages.length} terminated marriage(s) with children: ` +
      `These marriages were automatically terminated due to person deletion ` +
      `but their children remain in the tree.`
    )
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    nodeErrors
  }
}

/**
 * Get the validation status for a specific node
 */
export function getNodeValidationStatus(nodeId: string, validation: TreeValidationResult): NodeValidationStatus {
  // Check if node has errors
  if (validation.nodeErrors[nodeId] && validation.nodeErrors[nodeId].length > 0) {
    return 'error'
  }
  
  // Check if node is mentioned in warnings (isolated persons, orphaned children)
  if (validation.warnings.some(warning => 
    warning.includes('isolated persons') || 
    warning.includes('orphaned children')
  )) {
    // Check if this specific node is isolated or orphaned
    if (validation.nodeErrors[nodeId] && validation.nodeErrors[nodeId].some(error => 
      error.includes('isolated') || error.includes('orphaned')
    )) {
      return 'warning'
    }
  }
  
  return 'valid'
}