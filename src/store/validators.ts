import type { FamilyTree, Person, Marriage, ChildLink } from '../types/domain'
import { areDirectlyRelated } from '../utils/ancestryHelpers'

export interface ValidationErrorItem {
  field: string
  message: string
}

export class ValidationError extends Error {
  constructor(public errors: ValidationErrorItem[]) {
    super(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
    this.name = 'ValidationError'
  }
}

/**
 * Section 2.1: Identity and Shape Invariants
 * 
 * Ensures data integrity and uniqueness:
 * - All Person IDs must be unique and non-empty
 * - All Marriage IDs must be unique and non-empty  
 * - Person names must be at least 2 characters (trimmed)
 * - Person gender must be 'M' or 'F' only
 * - No self-marriage (husbandId !== wifeId)
 */
export function validateIdentityAndShape(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Check all Person IDs are unique
  const personIds = new Set<string>()
  for (const person of data.persons) {
    if (!person.id) {
      errors.push({ field: 'person.id', message: 'Person ID is required' })
    } else if (personIds.has(person.id)) {
      errors.push({ field: 'person.id', message: `Duplicate person ID: ${person.id}` })
    } else {
      personIds.add(person.id)
    }
    
    // Name validation (trimmed length >= 2)
    if (!person.name || person.name.trim().length < 2) {
      errors.push({ field: 'person.name', message: `Person ${person.id} name must be at least 2 characters` })
    }
    
    // Gender validation (M or F only)
    if (!['M', 'F'].includes(person.gender)) {
      errors.push({ field: 'person.gender', message: `Person ${person.id} gender must be M or F` })
    }
  }
  
  // Check all Marriage IDs are unique
  const marriageIds = new Set<string>()
  for (const marriage of data.marriages) {
    if (!marriage.id) {
      errors.push({ field: 'marriage.id', message: 'Marriage ID is required' })
    } else if (marriageIds.has(marriage.id)) {
      errors.push({ field: 'marriage.id', message: `Duplicate marriage ID: ${marriage.id}` })
    } else {
      marriageIds.add(marriage.id)
    }
    
    // No self-marriage
    if (marriage.husbandId === marriage.wifeId) {
      errors.push({ field: 'marriage', message: `Self-marriage not allowed: ${marriage.id}` })
    }
  }
  
  return errors
}

/**
 * Section 2.2: Gender and Marriage Validity
 * 
 * Enforces gender-based marriage rules:
 * - Marriage must be between one male (M) and one female (F)
 * - Husband must have gender 'M'
 * - Wife must have gender 'F'
 */
export function validateGenderAndMarriage(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  const personById = new Map(data.persons.map(p => [p.id, p]))
  
  for (const marriage of data.marriages) {
    const husband = marriage.husbandId ? personById.get(marriage.husbandId) : null
    const wife = marriage.wifeId ? personById.get(marriage.wifeId) : null
    
    // Check if this is an incomplete parent marriage (one null spouse)
    const isIncompleteParentMarriage = (marriage.husbandId === null) !== (marriage.wifeId === null)
    
    if (isIncompleteParentMarriage) {
      // Allow incomplete parent marriages if they have children
      const hasChildren = data.children.some(c => c.marriageId === marriage.id)
      if (!hasChildren) {
        errors.push({
          field: 'marriage',
          message: `Incomplete parent marriage must have children`
        })
      }
    } else {
      // Normal marriage validation - both spouses must exist and have correct genders
      if (husband && husband.gender !== 'M') {
        errors.push({ 
          field: 'marriage.husbandId', 
          message: `Husband ${marriage.husbandId} must have gender M` 
        })
      }
      
      if (wife && wife.gender !== 'F') {
        errors.push({ 
          field: 'marriage.wifeId', 
          message: `Wife ${marriage.wifeId} must have gender F` 
        })
      }
      
      // Both spouses must exist for complete marriages
      if (!husband) {
        errors.push({ 
          field: 'marriage.husbandId', 
          message: `Husband ${marriage.husbandId} not found` 
        })
      }
      
      if (!wife) {
        errors.push({ 
          field: 'marriage.wifeId', 
          message: `Wife ${marriage.wifeId} not found` 
        })
      }
    }
  }
  
  return errors
}

/**
 * Section 2.3: Active Marriage Limits (Polygamy Rules)
 * 
 * Enforces polygamy constraints:
 * - Husband can have at most 4 active marriages
 * - Wife can have at most 1 active marriage
 * - No duplicate active marriages between same two persons
 * - Historical marriages (divorced, widowed, terminated) don't count
 */
export function validatePolygamyLimits(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Count active marriages per person
  const activeMarriagesByHusband = new Map<string, number>()
  const activeMarriagesByWife = new Map<string, number>()
  const activeMarriagePairs = new Set<string>()
  
  for (const marriage of data.marriages) {
    if (marriage.status === 'active') {
      // Only count complete marriages (both spouses present) for polygamy limits
      if (marriage.husbandId && marriage.wifeId) {
        // Count husband's active marriages
        const husbandCount = (activeMarriagesByHusband.get(marriage.husbandId) || 0) + 1
        activeMarriagesByHusband.set(marriage.husbandId, husbandCount)
        
        // Count wife's active marriages
        const wifeCount = (activeMarriagesByWife.get(marriage.wifeId) || 0) + 1
        activeMarriagesByWife.set(marriage.wifeId, wifeCount)
        
        // Check for duplicate active marriages
        const pair = [marriage.husbandId, marriage.wifeId].sort().join('-')
        if (activeMarriagePairs.has(pair)) {
          errors.push({
            field: 'marriage',
            message: `Duplicate active marriage between ${marriage.husbandId} and ${marriage.wifeId}`
          })
        }
        activeMarriagePairs.add(pair)
      }
    }
  }
  
  // Check limits
  for (const [husbandId, count] of activeMarriagesByHusband) {
    if (count > 4) {
      errors.push({
        field: 'marriage',
        message: `Husband ${husbandId} has ${count} active marriages (max 4)`
      })
    }
  }
  
  for (const [wifeId, count] of activeMarriagesByWife) {
    if (count > 1) {
      errors.push({
        field: 'marriage',
        message: `Wife ${wifeId} has ${count} active marriages (max 1)`
      })
    }
  }
  
  return errors
}

/**
 * Section 2.4: Parent Assignment Rules
 * 
 * Ensures proper parent-child relationships:
 * - Each child can have exactly one ChildLink
 * - All ChildLink references must be valid
 * - Marriage must have two valid partners
 */
export function validateParentAssignment(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  const personById = new Map(data.persons.map(p => [p.id, p]))
  const marriageById = new Map(data.marriages.map(m => [m.id, m]))
  const childLinksByChild = new Map<string, ChildLink[]>()
  
  // Group ChildLinks by child
  for (const childLink of data.children) {
    if (!childLinksByChild.has(childLink.childId)) {
      childLinksByChild.set(childLink.childId, [])
    }
    childLinksByChild.get(childLink.childId)!.push(childLink)
  }
  
  // Check each child has exactly one ChildLink
  for (const [childId, links] of childLinksByChild) {
    if (links.length > 1) {
      errors.push({
        field: 'child',
        message: `Child ${childId} has ${links.length} ChildLinks (max 1)`
      })
    }
  }
  
  // Check ChildLink references are valid
  for (const childLink of data.children) {
    if (!personById.has(childLink.childId)) {
      errors.push({
        field: 'child.childId',
        message: `Child ${childLink.childId} not found`
      })
    }
    
    const marriage = marriageById.get(childLink.marriageId)
    if (!marriage) {
      errors.push({
        field: 'child.marriageId',
        message: `Marriage ${childLink.marriageId} not found`
      })
    } else {
      // Check marriage has valid partners (allow null for incomplete parent marriages)
      const isIncompleteParentMarriage = !marriage.husbandId || !marriage.wifeId
      
      if (!isIncompleteParentMarriage) {
        // Complete marriage - both partners must exist
        if (!personById.has(marriage.husbandId!) || !personById.has(marriage.wifeId!)) {
          errors.push({
            field: 'child.marriageId',
            message: `Marriage ${childLink.marriageId} has invalid partners`
          })
        }
      } else {
        // Incomplete parent marriage - validate the non-null partner
        const existingParentId = marriage.husbandId || marriage.wifeId
        if (existingParentId && !personById.has(existingParentId)) {
          errors.push({
            field: 'child.marriageId',
            message: `Incomplete marriage ${childLink.marriageId} has invalid parent`
          })
        }
      }
    }
  }
  
  return errors
}

/**
 * Section 2.5: Ancestry and Cycle Rules
 * 
 * Prevents invalid family relationships:
 * - No marriage between direct ancestors and descendants
 * - No cycles in parent-child relationships
 * - Maintain acyclic family tree structure
 */
export function validateAncestryRules(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Check for ancestor-descendant marriages
  for (const marriage of data.marriages) {
    if (marriage.husbandId && marriage.wifeId && areDirectlyRelated(marriage.husbandId, marriage.wifeId, data)) {
      errors.push({
        field: 'marriage',
        message: `Cannot marry direct ancestor or descendant: ${marriage.husbandId} and ${marriage.wifeId}`
      })
    }
  }
  
  // Check for parent-child cycles
  const cycleErrors = detectCycles(data)
  errors.push(...cycleErrors)
  
  return errors
}

// Helper: Detect cycles in parent-child relationships
function detectCycles(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function dfs(personId: string, path: string[]): boolean {
    if (recursionStack.has(personId)) {
      errors.push({
        field: 'ancestry',
        message: `Cycle detected: ${path.join(' → ')} → ${personId}`
      })
      return true
    }
    
    if (visited.has(personId)) return false
    
    visited.add(personId)
    recursionStack.add(personId)
    
    // Find parents
    const childLinks = data.children.filter(c => c.childId === personId)
    for (const link of childLinks) {
      const marriage = data.marriages.find(m => m.id === link.marriageId)
      if (marriage) {
        if (marriage.husbandId && dfs(marriage.husbandId, [...path, personId])) return true
        if (marriage.wifeId && dfs(marriage.wifeId, [...path, personId])) return true
      }
    }
    
    recursionStack.delete(personId)
    return false
  }
  
  for (const person of data.persons) {
    if (!visited.has(person.id)) {
      dfs(person.id, [])
    }
  }
  
  return errors
}

/**
 * Main validation function: Run all hard invariants
 * 
 * Executes all Section 2 validation rules in sequence:
 * - Section 2.1: Identity and Shape
 * - Section 2.2: Gender and Marriage Validity  
 * - Section 2.3: Active Marriage Limits
 * - Section 2.4: Parent Assignment Rules
 * - Section 2.5: Ancestry and Cycle Rules
 */
export function validateHardInvariants(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Section 2.1: Identity and Shape
  errors.push(...validateIdentityAndShape(data))
  
  // Section 2.2: Gender and Marriage Validity
  errors.push(...validateGenderAndMarriage(data))
  
  // Section 2.3: Active Marriage Limits
  errors.push(...validatePolygamyLimits(data))
  
  // Section 2.4: Parent Assignment Rules
  errors.push(...validateParentAssignment(data))
  
  // Section 2.5: Ancestry and Cycle Rules
  errors.push(...validateAncestryRules(data))
  
  return errors
}

/**
 * Section 5: Warning-Level Checks
 * 
 * These checks flag data quality issues but don't block operations:
 * - Multiple root persons detected
 * - Isolated persons (no parents, no spouse, no children, not root)
 * - Orphaned children (promoted to root due to parent deletion)
 * - Auto-terminated marriages
 */
export interface ValidationWarnings {
  multipleRoots: boolean
  rootCount: number
  isolatedPersons: string[]
  orphanedChildren: string[]
  autoTerminatedMarriages: string[]
}

export function checkWarnings(data: FamilyTree): ValidationWarnings {
  const warnings: ValidationWarnings = {
    multipleRoots: false,
    rootCount: 0,
    isolatedPersons: [],
    orphanedChildren: [],
    autoTerminatedMarriages: []
  }
  
  // Count root persons
  const rootPersons = data.persons.filter(p => p.isRoot)
  warnings.rootCount = rootPersons.length
  warnings.multipleRoots = rootPersons.length > 1
  
  // Find isolated persons (no parents, no spouse, no children, not root)
  const hasChildLink = new Set(data.children.map(c => c.childId))
  const inMarriage = new Set<string>()
  data.marriages.forEach(m => {
    if (m.husbandId) inMarriage.add(m.husbandId)
    if (m.wifeId) inMarriage.add(m.wifeId)
  })
  const hasChildren = new Set<string>()
  data.children.forEach(c => {
    const marriage = data.marriages.find(m => m.id === c.marriageId)
    if (marriage) {
      if (marriage.husbandId) hasChildren.add(marriage.husbandId)
      if (marriage.wifeId) hasChildren.add(marriage.wifeId)
    }
  })
  
  for (const person of data.persons) {
    if (!person.isRoot && 
        !hasChildLink.has(person.id) && 
        !inMarriage.has(person.id) && 
        !hasChildren.has(person.id)) {
      warnings.isolatedPersons.push(person.id)
    }
  }
  
  // Find orphaned children (roots that shouldn't be roots)
  // A child is "orphaned" if they're a root but have marriages/children
  // This indicates they became root due to parent deletion
  const suspiciousRoots = rootPersons.filter(person => {
    const hasMarriage = data.marriages.some(m => 
      m.husbandId === person.id || m.wifeId === person.id
    )
    const hasChildren = data.children.some(c => {
      const marriage = data.marriages.find(m => m.id === c.marriageId)
      return marriage && (marriage.husbandId === person.id || marriage.wifeId === person.id)
    })
    return hasMarriage || hasChildren
  })
  warnings.orphanedChildren = suspiciousRoots.map(p => p.id)
  
  // Find auto-terminated marriages
  // Marriages with status 'terminated' or 'widowed' that have children
  const autoTerminated = data.marriages.filter(m => {
    if (m.status !== 'terminated' && m.status !== 'widowed') return false
    const hasChildren = data.children.some(c => c.marriageId === m.id)
    return hasChildren
  })
  warnings.autoTerminatedMarriages = autoTerminated.map(m => m.id)
  
  return warnings
}

// Legacy functions for backward compatibility
export function validatePersonShape(person: Partial<Person>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  if (!person.id || typeof person.id !== 'string') {
    errors.push({ field: 'id', message: 'Person ID is required' })
  }
  
  if (!person.name || typeof person.name !== 'string' || person.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Person name is required' })
  }
  
  if (!person.gender || !['M', 'F'].includes(person.gender)) {
    errors.push({ field: 'gender', message: 'Gender must be M or F' })
  }
  
  if (typeof person.isRoot !== 'boolean') {
    errors.push({ field: 'isRoot', message: 'isRoot must be boolean' })
  }
  
  return errors
}

export function validateMarriageShape(marriage: Partial<Marriage>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  if (!marriage.id || typeof marriage.id !== 'string') {
    errors.push({ field: 'id', message: 'Marriage ID is required' })
  }
  
  if (!marriage.husbandId || typeof marriage.husbandId !== 'string') {
    errors.push({ field: 'husbandId', message: 'Husband ID is required' })
  }
  
  if (!marriage.wifeId || typeof marriage.wifeId !== 'string') {
    errors.push({ field: 'wifeId', message: 'Wife ID is required' })
  }
  
  if (!marriage.status || !['active', 'divorced', 'widowed', 'terminated'].includes(marriage.status)) {
    errors.push({ field: 'status', message: 'Status must be active, divorced, widowed, or terminated' })
  }
  
  return errors
}

export function validateChildLinkShape(childLink: Partial<ChildLink>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  if (!childLink.childId || typeof childLink.childId !== 'string') {
    errors.push({ field: 'childId', message: 'Child ID is required' })
  }
  
  if (!childLink.marriageId || typeof childLink.marriageId !== 'string') {
    errors.push({ field: 'marriageId', message: 'Marriage ID is required' })
  }
  
  return errors
}

export function validateFamilyTree(data: FamilyTree): ValidationErrorItem[] {
  return validateHardInvariants(data)
}