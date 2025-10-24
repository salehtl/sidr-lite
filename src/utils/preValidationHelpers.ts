import type { FamilyTree, Gender } from '../types/domain'
import { validateGenderForMarriage, determineHusbandWife, getGenderErrorMessage } from './relationshipHelpers'

export interface PreValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

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
    
    // Check polygamy limits
    const targetMarriages = currentData.marriages.filter(m => 
      m.husbandId === targetId || m.wifeId === targetId
    )
    const activeMarriages = targetMarriages.filter(m => m.status === 'active')
    
    if (targetPerson.gender === 'M' && activeMarriages.length >= 4) {
      errors.push(`${targetPerson.name} already has 4 active marriages (maximum allowed)`)
      return { isValid: false, errors, warnings }
    }
    
    if (targetPerson.gender === 'F' && activeMarriages.length >= 1) {
      errors.push(`${targetPerson.name} already has an active marriage`)
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
      errors.push(`${child.name} already has both parents`)
      return { isValid: false, errors, warnings }
    }
  }
  
  if (relationshipType === 'sibling' && targetId) {
    const sibling = currentData.persons.find(p => p.id === targetId)
    if (!sibling) {
      errors.push('Selected person not found')
      return { isValid: false, errors, warnings }
    }
    
    // Check if person has parents (required for siblings)
    const hasParents = currentData.children.some(c => c.childId === targetId)
    if (!hasParents) {
      errors.push(`${sibling.name} has no parents, so cannot add siblings`)
      return { isValid: false, errors, warnings }
    }
  }
  
  return { isValid: true, errors, warnings }
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
  
  if (personAId === personBId) {
    errors.push('Cannot marry a person to themselves')
    return { isValid: false, errors, warnings }
  }
  
  // Check for existing marriage
  const existingMarriage = currentData.marriages.find(m => 
    (m.husbandId === personAId && m.wifeId === personBId) ||
    (m.husbandId === personBId && m.wifeId === personAId)
  )
  
  if (existingMarriage) {
    errors.push('Marriage already exists between these persons')
    return { isValid: false, errors, warnings }
  }
  
  // Check gender compatibility
  if (!validateGenderForMarriage(personA, personB)) {
    errors.push(getGenderErrorMessage(personA, personB))
    return { isValid: false, errors, warnings }
  }
  
  // Check polygamy limits
  const personAMarriages = currentData.marriages.filter(m => 
    m.husbandId === personAId || m.wifeId === personAId
  )
  const personBMarriages = currentData.marriages.filter(m => 
    m.husbandId === personBId || m.wifeId === personBId
  )
  
  const activeAMarriages = personAMarriages.filter(m => m.status === 'active')
  const activeBMarriages = personBMarriages.filter(m => m.status === 'active')
  
  // Determine who would be husband/wife
  const { husbandId, wifeId } = determineHusbandWife(personA, personB)
  
  if (husbandId === personAId && activeAMarriages.length >= 4) {
    errors.push(`${personA.name} already has 4 active marriages (maximum allowed)`)
    return { isValid: false, errors, warnings }
  }
  
  if (wifeId === personAId && activeAMarriages.length >= 1) {
    errors.push(`${personA.name} already has an active marriage`)
    return { isValid: false, errors, warnings }
  }
  
  if (husbandId === personBId && activeBMarriages.length >= 4) {
    errors.push(`${personB.name} already has 4 active marriages (maximum allowed)`)
    return { isValid: false, errors, warnings }
  }
  
  if (wifeId === personBId && activeBMarriages.length >= 1) {
    errors.push(`${personB.name} already has an active marriage`)
    return { isValid: false, errors, warnings }
  }
  
  return { isValid: true, errors, warnings }
}

