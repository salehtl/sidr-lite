import type { FamilyTree } from '../types/domain'
import { validateHardInvariants, checkWarnings } from '../store/validators'

export interface StagedValidationResult {
  isValid: boolean
  criticalErrors: string[]
  warnings: string[]
}

/**
 * Legacy function - now redirects to the new validation system.
 * This is kept for backward compatibility but should be replaced with validateAndCommit.
 * @deprecated Use validateAndCommit from validationExecutor instead
 */
export function validateStagedOperation(
  _currentData: FamilyTree, 
  stagedData: FamilyTree
): StagedValidationResult {
  const criticalErrors: string[] = []
  const warnings: string[] = []
  
  // Run hard invariants validation
  const errors = validateHardInvariants(stagedData)
  if (errors.length > 0) {
    criticalErrors.push(...errors.map(e => e.message))
  }
  
  // Check warnings
  const warningData = checkWarnings(stagedData)
  if (warningData.multipleRoots) {
    warnings.push('Multiple root persons found')
  }
  if (warningData.isolatedPersons.length > 0) {
    warnings.push(`${warningData.isolatedPersons.length} isolated person(s) not connected to family tree`)
  }
  if (warningData.orphanedChildren.length > 0) {
    warnings.push(`${warningData.orphanedChildren.length} orphaned children detected`)
  }
  
  return {
    isValid: criticalErrors.length === 0,
    criticalErrors,
    warnings
  }
}

/**
 * Legacy function - now redirects to the new validation system.
 * @deprecated Use validateAndCommit from validationExecutor instead
 */
export function applyStagedValidation(
  currentData: FamilyTree,
  mutation: (data: FamilyTree) => FamilyTree,
  onWarnings?: (warnings: string[]) => void
): FamilyTree {
  // Apply the mutation
  const stagedData = mutation(currentData)
  
  // Validate the staged data
  const result = validateStagedOperation(currentData, stagedData)
  
  if (!result.isValid) {
    throw new Error(`Validation failed: ${result.criticalErrors.join(', ')}`)
  }
  
  // Surface warnings if callback provided
  if (onWarnings && result.warnings.length > 0) {
    onWarnings(result.warnings)
  }
  
  return stagedData
}