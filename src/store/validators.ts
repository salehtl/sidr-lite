import type { FamilyTree, Person, Marriage, ChildLink } from '../types/domain'

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

export function validatePersonShape(person: Partial<Person>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  if (!person.id || typeof person.id !== 'string') {
    errors.push({ field: 'id', message: 'Person ID is required' })
  }
  
  if (!person.name || typeof person.name !== 'string' || person.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Person name is required' })
  }
  
  if (!person.gender || !['M', 'F', 'U'].includes(person.gender)) {
    errors.push({ field: 'gender', message: 'Gender must be M, F, or U' })
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
  
  if (!marriage.status || !['active', 'divorced', 'widowed'].includes(marriage.status)) {
    errors.push({ field: 'status', message: 'Status must be active, divorced, or widowed' })
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

export function validateReferentialIntegrity(
  data: FamilyTree,
  personById: Map<string, Person>,
  marriageById: Map<string, Marriage>
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Check marriage references
  for (const marriage of data.marriages) {
    if (!personById.has(marriage.husbandId)) {
      errors.push({ 
        field: 'marriage.husbandId', 
        message: `Husband ${marriage.husbandId} not found` 
      })
    }
    if (!personById.has(marriage.wifeId)) {
      errors.push({ 
        field: 'marriage.wifeId', 
        message: `Wife ${marriage.wifeId} not found` 
      })
    }
  }
  
  // Check child references
  for (const child of data.children) {
    if (!personById.has(child.childId)) {
      errors.push({ 
        field: 'child.childId', 
        message: `Child ${child.childId} not found` 
      })
    }
    if (!marriageById.has(child.marriageId)) {
      errors.push({ 
        field: 'child.marriageId', 
        message: `Marriage ${child.marriageId} not found` 
      })
    }
  }
  
  return errors
}

export function validateDomainRules(
  data: FamilyTree,
  marriagesByHusband: Map<string, Marriage[]>,
  marriagesByWife: Map<string, Marriage[]>,
  childrenByChild: Map<string, ChildLink>
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Check polygamy limits
  for (const [husbandId, marriages] of marriagesByHusband) {
    const activeMarriages = marriages.filter(m => m.status === 'active')
    if (activeMarriages.length > 4) {
      errors.push({
        field: 'marriage',
        message: `Husband ${husbandId} has ${activeMarriages.length} active marriages (max 4)`
      })
    }
  }
  
  for (const [wifeId, marriages] of marriagesByWife) {
    const activeMarriages = marriages.filter(m => m.status === 'active')
    if (activeMarriages.length > 1) {
      errors.push({
        field: 'marriage',
        message: `Wife ${wifeId} has ${activeMarriages.length} active marriages (max 1)`
      })
    }
  }
  
  // Check for duplicate marriages
  const marriagePairs = new Set<string>()
  for (const marriage of data.marriages) {
    const pair = [marriage.husbandId, marriage.wifeId].sort().join('-')
    if (marriagePairs.has(pair)) {
      errors.push({
        field: 'marriage',
        message: `Duplicate marriage between ${marriage.husbandId} and ${marriage.wifeId}`
      })
    }
    marriagePairs.add(pair)
  }
  
  // Check child belongs to exactly one marriage
  for (const [childId] of childrenByChild) {
    const otherChildren = data.children.filter(c => c.childId === childId)
    if (otherChildren.length > 1) {
      errors.push({
        field: 'child',
        message: `Child ${childId} belongs to ${otherChildren.length} marriages (max 1)`
      })
    }
  }
  
  return errors
}

export function validateFamilyTree(data: FamilyTree): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  
  // Build indices for validation
  const personById = new Map(data.persons.map(p => [p.id, p]))
  const marriageById = new Map(data.marriages.map(m => [m.id, m]))
  
  const marriagesByHusband = new Map<string, Marriage[]>()
  const marriagesByWife = new Map<string, Marriage[]>()
  const childrenByChild = new Map<string, ChildLink>()
  
  for (const marriage of data.marriages) {
    if (!marriagesByHusband.has(marriage.husbandId)) {
      marriagesByHusband.set(marriage.husbandId, [])
    }
    marriagesByHusband.get(marriage.husbandId)!.push(marriage)
    
    if (!marriagesByWife.has(marriage.wifeId)) {
      marriagesByWife.set(marriage.wifeId, [])
    }
    marriagesByWife.get(marriage.wifeId)!.push(marriage)
  }
  
  for (const child of data.children) {
    childrenByChild.set(child.childId, child)
  }
  
  // Run all validations
  errors.push(...validateReferentialIntegrity(data, personById, marriageById))
  errors.push(...validateDomainRules(data, marriagesByHusband, marriagesByWife, childrenByChild))
  
  return errors
}
