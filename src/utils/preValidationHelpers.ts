import type { FamilyTree, Gender } from '../types/domain'
import { validateGenderForMarriage, determineHusbandWife, getGenderErrorMessage } from './relationshipHelpers'
import { areDirectlyRelated } from './ancestryHelpers'

export interface PreValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Simplified pre-validation for UI operations.
 * This provides quick feedback before the main validation system runs.
 * The main validation system will catch all issues, so this is just for UX.
 */
export function preValidatePersonCreation(
  name: string, 
  gender: Gender, 
  relationshipType: string | null, 
  targetId: string | null,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic validation
  if (!name.trim()) {
    errors.push('Name is required')
    return { isValid: false, errors, warnings }
  }
  
  if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
    return { isValid: false, errors, warnings }
  }
  
  // Relationship-specific validation
  if (relationshipType === 'spouse' && targetId) {
    const targetPerson = currentData.persons.find(p => p.id === targetId)
    if (!targetPerson) {
      errors.push('Selected person not found')
      return { isValid: false, errors, warnings }
    }
    
    // Check gender compatibility
    if (!validateGenderForMarriage({ id: '', name: '', gender, isRoot: false }, targetPerson)) {
      errors.push(`Cannot marry ${targetPerson.name}: ${getGenderErrorMessage({ id: '', name: '', gender, isRoot: false }, targetPerson)}`)
      return { isValid: false, errors, warnings }
    }
    
    // Check for ancestor-descendant relationship
    if (areDirectlyRelated('', targetId, currentData)) {
      errors.push('Cannot marry direct ancestor or descendant')
      return { isValid: false, errors, warnings }
    }
    
    // Check marriage limits
    const { husbandId, wifeId } = determineHusbandWife({ id: '', name: '', gender, isRoot: false }, targetPerson)
    const activeMarriages = currentData.marriages.filter(m => 
      m.status === 'active' && 
      ((m.husbandId === husbandId) || (m.wifeId === wifeId))
    )
    
    // Check husband marriage limit (max 4)
    const husbandMarriages = activeMarriages.filter(m => m.husbandId === husbandId)
    if (husbandMarriages.length >= 4) {
      errors.push('Husband already has 4 active marriages (maximum allowed)')
      return { isValid: false, errors, warnings }
    }
    
    // Check wife marriage limit (max 1)
    const wifeMarriages = activeMarriages.filter(m => m.wifeId === wifeId)
    if (wifeMarriages.length >= 1) {
      errors.push('Wife already has an active marriage (maximum 1 allowed)')
      return { isValid: false, errors, warnings }
    }
  }
  
  if (relationshipType === 'child' && targetId) {
    const marriage = currentData.marriages.find(m => m.id === targetId)
    if (!marriage) {
      errors.push('Selected marriage not found')
      return { isValid: false, errors, warnings }
    }
  }
  
  if (relationshipType === 'parent' && targetId) {
    const child = currentData.persons.find(p => p.id === targetId)
    if (!child) {
      errors.push('Selected person not found')
      return { isValid: false, errors, warnings }
    }
    
    // Check if child already has 2 parents
    const existingParents = currentData.children.filter(c => c.childId === targetId)
    if (existingParents.length >= 2) {
      errors.push('Child already has both parents')
      return { isValid: false, errors, warnings }
    }
  }
  
  if (relationshipType === 'sibling' && targetId) {
    const person = currentData.persons.find(p => p.id === targetId)
    if (!person) {
      errors.push('Selected person not found')
      return { isValid: false, errors, warnings }
    }
    
    // Check if person has parents (required for siblings)
    const hasParents = currentData.children.some(c => c.childId === targetId)
    if (!hasParents) {
      errors.push('Father has no parents, so cannot add siblings')
      return { isValid: false, errors, warnings }
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

export function preValidateMarriageCreation(
  personAId: string,
  personBId: string,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const personA = currentData.persons.find(p => p.id === personAId)
  const personB = currentData.persons.find(p => p.id === personBId)
  
  if (!personA) {
    errors.push('First person not found')
    return { isValid: false, errors, warnings }
  }
  
  if (!personB) {
    errors.push('Second person not found')
    return { isValid: false, errors, warnings }
  }
  
  // Check for self-marriage
  if (personAId === personBId) {
    errors.push('Cannot marry a person to themselves')
    return { isValid: false, errors, warnings }
  }
  
  // Check gender compatibility
  if (!validateGenderForMarriage(personA, personB)) {
    errors.push(getGenderErrorMessage(personA, personB))
    return { isValid: false, errors, warnings }
  }
  
  // Check for ancestor-descendant relationship
  if (areDirectlyRelated(personAId, personBId, currentData)) {
    errors.push('Cannot marry direct ancestor or descendant')
    return { isValid: false, errors, warnings }
  }
  
  // Check for duplicate active marriage
  const existingMarriage = currentData.marriages.find(m => 
    m.status === 'active' && 
    ((m.husbandId === personAId && m.wifeId === personBId) || 
     (m.husbandId === personBId && m.wifeId === personAId))
  )
  if (existingMarriage) {
    errors.push('Active marriage already exists between these persons')
    return { isValid: false, errors, warnings }
  }
  
  // Check marriage limits
  const { husbandId, wifeId } = determineHusbandWife(personA, personB)
  const activeMarriages = currentData.marriages.filter(m => 
    m.status === 'active' && 
    ((m.husbandId === husbandId) || (m.wifeId === wifeId))
  )
  
  // Check husband marriage limit (max 4)
  const husbandMarriages = activeMarriages.filter(m => m.husbandId === husbandId)
  if (husbandMarriages.length >= 4) {
    errors.push('Husband already has 4 active marriages (maximum allowed)')
    return { isValid: false, errors, warnings }
  }
  
  // Check wife marriage limit (max 1)
  const wifeMarriages = activeMarriages.filter(m => m.wifeId === wifeId)
  if (wifeMarriages.length >= 1) {
    errors.push('Wife already has an active marriage (maximum 1 allowed)')
    return { isValid: false, errors, warnings }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

export function preValidateChildCreation(
  marriageId: string,
  name: string,
  gender: Gender,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!name.trim()) {
    errors.push('Child name is required')
    return { isValid: false, errors, warnings }
  }
  
  if (name.trim().length < 2) {
    errors.push('Child name must be at least 2 characters long')
    return { isValid: false, errors, warnings }
  }
  
  const marriage = currentData.marriages.find(m => m.id === marriageId)
  if (!marriage) {
    errors.push('Marriage not found')
    return { isValid: false, errors, warnings }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

export function preValidateParentCreation(
  childId: string,
  parentName: string,
  parentGender: Gender,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!parentName.trim()) {
    errors.push('Parent name is required')
    return { isValid: false, errors, warnings }
  }
  
  if (parentName.trim().length < 2) {
    errors.push('Parent name must be at least 2 characters long')
    return { isValid: false, errors, warnings }
  }
  
  const child = currentData.persons.find(p => p.id === childId)
  if (!child) {
    errors.push('Child not found')
    return { isValid: false, errors, warnings }
  }
  
  // Check if child already has 2 parents
  const existingParents = currentData.children.filter(c => c.childId === childId)
  if (existingParents.length >= 2) {
    errors.push('Child already has maximum number of parents (2)')
    return { isValid: false, errors, warnings }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Pre-validate sibling creation
 */
export function preValidateSiblingCreation(
  personId: string,
  siblingName: string,
  siblingGender: Gender,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic validation
  if (!siblingName.trim()) {
    errors.push('Sibling name is required')
    return { isValid: false, errors, warnings }
  }
  
  if (siblingName.trim().length < 2) {
    errors.push('Sibling name must be at least 2 characters')
    return { isValid: false, errors, warnings }
  }
  
  // Check if person exists
  const person = currentData.persons.find(p => p.id === personId)
  if (!person) {
    errors.push('Person not found')
    return { isValid: false, errors, warnings }
  }
  
  // Check if person has parents (required for siblings)
  const childLink = currentData.children.find(c => c.childId === personId)
  if (!childLink) {
    errors.push('Cannot add sibling: person has no parents')
    return { isValid: false, errors, warnings }
  }
  
  // Check if parents' marriage is valid
  const parentsMarriage = currentData.marriages.find(m => m.id === childLink.marriageId)
  if (!parentsMarriage) {
    errors.push('Cannot add sibling: parents\' marriage not found')
    return { isValid: false, errors, warnings }
  }
  
  // Check if parents' marriage is active (not terminated)
  if (parentsMarriage.status !== 'active') {
    errors.push('Cannot add sibling: parents\' marriage is not active')
    return { isValid: false, errors, warnings }
  }
  
  // Check if parents can have more children (polygamy limits)
  const husband = parentsMarriage.husbandId ? currentData.persons.find(p => p.id === parentsMarriage.husbandId) : null
  const wife = parentsMarriage.wifeId ? currentData.persons.find(p => p.id === parentsMarriage.wifeId) : null
  
  if (husband) {
    const husbandActiveMarriages = currentData.marriages.filter(m => 
      m.husbandId === husband.id && m.status === 'active'
    ).length
    
    if (husbandActiveMarriages >= 4) {
      errors.push('Cannot add sibling: father has reached maximum of 4 active marriages')
      return { isValid: false, errors, warnings }
    }
  }
  
  if (wife) {
    const wifeActiveMarriages = currentData.marriages.filter(m => 
      m.wifeId === wife.id && m.status === 'active'
    ).length
    
    if (wifeActiveMarriages >= 1) {
      errors.push('Cannot add sibling: mother has reached maximum of 1 active marriage')
      return { isValid: false, errors, warnings }
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Pre-validate parent completion
 */
export function preValidateParentCompletion(
  marriageId: string,
  secondParentId: string,
  currentData: FamilyTree
): PreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check if marriage exists and is incomplete
  const marriage = currentData.marriages.find(m => m.id === marriageId)
  if (!marriage) {
    errors.push('Marriage not found')
    return { isValid: false, errors, warnings }
  }
  
  const isIncomplete = !marriage.husbandId || !marriage.wifeId
  if (!isIncomplete) {
    errors.push('Marriage is already complete')
    return { isValid: false, errors, warnings }
  }
  
  // Check if second parent exists
  const secondParent = currentData.persons.find(p => p.id === secondParentId)
  if (!secondParent) {
    errors.push('Second parent not found')
    return { isValid: false, errors, warnings }
  }
  
  // Check gender compatibility
  const existingParentId = marriage.husbandId || marriage.wifeId
  const existingParent = existingParentId ? currentData.persons.find(p => p.id === existingParentId) : null
  
  if (existingParent) {
    if (existingParent.gender === secondParent.gender) {
      errors.push('Cannot complete marriage: both parents have the same gender')
      return { isValid: false, errors, warnings }
    }
    
    // Check if they're already married to someone else
    const existingMarriage = currentData.marriages.find(m => 
      m.status === 'active' && 
      ((m.husbandId === secondParentId && m.wifeId !== existingParentId) ||
       (m.wifeId === secondParentId && m.husbandId !== existingParentId))
    )
    
    if (existingMarriage) {
      errors.push('Cannot complete marriage: second parent is already married to someone else')
      return { isValid: false, errors, warnings }
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}