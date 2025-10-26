import type { FamilyTree } from '../types/domain'
import { validateHardInvariants, checkWarnings } from './validators'
import type { ValidationWarnings, ValidationErrorItem } from './validators'
import { recalculateAllRoots } from '../utils/isRootCalculator'

// Re-export for convenience
export type { ValidationWarnings, ValidationErrorItem }

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrorItem[]
  warnings: ValidationWarnings
}

/**
 * Section 7: Validation Execution Model
 * 
 * All changes follow the same flow:
 * 1. Clone current Tree state
 * 2. Apply the proposed change to the clone
 * 3. Recalculate derived values (isRoot, statuses)
 * 4. Run all Hard Invariants
 * 5. If any Hard Invariant fails, reject and return errors
 * 6. If Hard Invariants pass, store the new Tree and surface any Warnings
 */
export function executeValidation(
  currentTree: FamilyTree,
  mutation: (tree: FamilyTree) => FamilyTree
): ValidationResult {
  // Step 1: Clone current tree
  const clonedTree = structuredClone(currentTree)
  
  // Step 2: Apply mutation
  const mutatedTree = mutation(clonedTree)
  
  // Step 3: Recalculate derived values
  const treeWithDerivedValues = recalculateAllRoots(mutatedTree)
  
  // Step 4: Run all hard invariants
  const errors = validateHardInvariants(treeWithDerivedValues)
  
  // Step 5: Check if valid
  const isValid = errors.length === 0
  
  // Step 6: Check warnings (only if valid)
  const warnings = isValid ? checkWarnings(treeWithDerivedValues) : {
    multipleRoots: false,
    rootCount: 0,
    isolatedPersons: [],
    orphanedChildren: [],
    autoTerminatedMarriages: []
  }
  
  return {
    isValid,
    errors,
    warnings
  }
}

/**
 * Convenience function for operations that need to validate and commit
 */
export function validateAndCommit(
  currentTree: FamilyTree,
  mutation: (tree: FamilyTree) => FamilyTree,
  onWarnings?: (warnings: ValidationWarnings) => void
): FamilyTree {
  const result = executeValidation(currentTree, mutation)
  
  if (!result.isValid) {
    throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`)
  }
  
  // Surface warnings if callback provided
  if (onWarnings && (result.warnings.multipleRoots || 
                      result.warnings.isolatedPersons.length > 0 ||
                      result.warnings.orphanedChildren.length > 0)) {
    onWarnings(result.warnings)
  }
  
  // Return the validated tree (with derived values recalculated)
  const clonedTree = structuredClone(currentTree)
  const mutatedTree = mutation(clonedTree)
  return recalculateAllRoots(mutatedTree)
}
