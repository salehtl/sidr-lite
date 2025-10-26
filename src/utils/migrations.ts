import type { FamilyTree, Gender } from '../types/domain'
import { recalculateAllRoots } from './isRootCalculator'

/**
 * Migrate family tree data from v1 to v2
 * Handles removal of 'U' gender and recalculates isRoot values
 */
export function migrateV1ToV2(data: FamilyTree): FamilyTree {
  // Step 1: Convert any 'U' gender persons to 'M' (default)
  const migratedPersons = data.persons.map(person => {
    if (person.gender === 'U' as any) {
      console.warn(`Person ${person.name} had unknown gender, defaulting to Male`)
      return { ...person, gender: 'M' as Gender }
    }
    return person
  })

  // Step 2: Create migrated data with updated persons
  const migratedData: FamilyTree = {
    ...data,
    persons: migratedPersons,
    version: 2
  }

  // Step 3: Recalculate isRoot for all persons based on ChildLinks
  const recalculatedData = recalculateAllRoots(migratedData)

  // Step 4: Validate the migrated data
  const validationErrors = validateMigratedData(recalculatedData)
  if (validationErrors.length > 0) {
    console.warn('Migration validation warnings:', validationErrors)
  }

  return recalculatedData
}

/**
 * Validate migrated data for common issues
 */
function validateMigratedData(data: FamilyTree): string[] {
  const warnings: string[] = []

  // Check for persons with invalid gender
  const invalidGenderPersons = data.persons.filter(p => !['M', 'F'].includes(p.gender))
  if (invalidGenderPersons.length > 0) {
    warnings.push(`${invalidGenderPersons.length} persons have invalid gender values`)
  }

  // Check for marriages with same gender partners
  const sameGenderMarriages = data.marriages.filter(marriage => {
    const husband = data.persons.find(p => p.id === marriage.husbandId)
    const wife = data.persons.find(p => p.id === marriage.wifeId)
    return husband && wife && husband.gender === wife.gender
  })
  
  if (sameGenderMarriages.length > 0) {
    warnings.push(`${sameGenderMarriages.length} marriages have same-gender partners`)
  }

  // Check for multiple root persons
  const rootPersons = data.persons.filter(p => p.isRoot)
  if (rootPersons.length > 1) {
    warnings.push(`Multiple root persons detected: ${rootPersons.length}`)
  }

  return warnings
}

/**
 * Check if data needs migration
 */
export function needsMigration(data: FamilyTree): boolean {
  return data.version < 2
}

/**
 * Get migration summary for user display
 */
export function getMigrationSummary(data: FamilyTree): string[] {
  const summary: string[] = []
  
  const unknownGenderCount = data.persons.filter(p => p.gender === 'U' as any).length
  if (unknownGenderCount > 0) {
    summary.push(`${unknownGenderCount} persons with unknown gender will be set to Male`)
  }
  
  const rootCount = data.persons.filter(p => p.isRoot).length
  if (rootCount > 1) {
    summary.push(`Multiple root persons detected: ${rootCount}`)
  }
  
  return summary
}
