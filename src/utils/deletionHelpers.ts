import type { FamilyTree, Person, Marriage, ChildLink } from '../types/domain'

export interface DeletionImpact {
  person: Person
  marriagesToDelete: Marriage[]
  childLinksToDelete: ChildLink[]
  orphanedChildren: Person[]
  totalAffectedRecords: number
}

export function calculateDeletionImpact(personId: string, data: FamilyTree): DeletionImpact {
  const person = data.persons.find(p => p.id === personId)
  
  if (!person) {
    throw new Error('Person not found')
  }
  
  // Find marriages involving this person
  const marriages = data.marriages.filter(m => 
    m.husbandId === personId || m.wifeId === personId
  )
  
  // Find children of those marriages
  const childLinks = data.children.filter(c => 
    marriages.some(m => m.id === c.marriageId)
  )
  
  // Find orphaned children (children who will have no parents after deletion)
  const orphanedChildren: Person[] = []
  
  for (const childLink of childLinks) {
    const child = data.persons.find(p => p.id === childLink.childId)
    if (!child) continue
    
    // Check if child has other parents (other marriages)
    const otherMarriages = data.marriages.filter(m => 
      !marriages.includes(m) && 
      data.children.some(cl => cl.marriageId === m.id && cl.childId === childLink.childId)
    )
    
    // If no other marriages, child will be orphaned
    if (otherMarriages.length === 0) {
      orphanedChildren.push(child)
    }
  }
  
  const totalAffectedRecords = 1 + marriages.length + childLinks.length + orphanedChildren.length
  
  return {
    person,
    marriagesToDelete: marriages,
    childLinksToDelete: childLinks,
    orphanedChildren,
    totalAffectedRecords
  }
}

export function getDeletionSummary(impact: DeletionImpact): string {
  const parts: string[] = []
  
  if (impact.marriagesToDelete.length > 0) {
    parts.push(`${impact.marriagesToDelete.length} marriage${impact.marriagesToDelete.length !== 1 ? 's' : ''}`)
  }
  
  if (impact.childLinksToDelete.length > 0) {
    parts.push(`${impact.childLinksToDelete.length} child relationship${impact.childLinksToDelete.length !== 1 ? 's' : ''}`)
  }
  
  if (impact.orphanedChildren.length > 0) {
    parts.push(`${impact.orphanedChildren.length} orphaned child${impact.orphanedChildren.length !== 1 ? 'ren' : ''}`)
  }
  
  if (parts.length === 0) {
    return 'No relationships to delete'
  }
  
  return `Will delete: ${parts.join(', ')}`
}

export function canDeletePerson(personId: string, data: FamilyTree): { canDelete: boolean, reason?: string } {
  const person = data.persons.find(p => p.id === personId)
  
  if (!person) {
    return { canDelete: false, reason: 'Person not found' }
  }
  
  // Check if this is the last person in the tree
  if (data.persons.length === 1) {
    return { canDelete: true, reason: 'This is the last person in your tree' }
  }
  
  return { canDelete: true }
}
