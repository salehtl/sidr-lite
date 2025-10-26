import type { FamilyTree, Person, ChildLink } from '../types/domain'

/**
 * Calculate if a person is a root (has no parents)
 * A person is root if they are not referenced as a child in any ChildLink
 */
export function calculateIsRoot(personId: string, children: ChildLink[]): boolean {
  return !children.some(child => child.childId === personId)
}

/**
 * Recalculate isRoot for all persons in the family tree
 * This ensures isRoot is always derived from the actual data structure
 */
export function recalculateAllRoots(data: FamilyTree): FamilyTree {
  const updatedPersons = data.persons.map(person => ({
    ...person,
    isRoot: calculateIsRoot(person.id, data.children)
  }))

  return {
    ...data,
    persons: updatedPersons
  }
}

/**
 * Recalculate isRoot for a specific person
 */
export function recalculatePersonRoot(personId: string, data: FamilyTree): Person | null {
  const person = data.persons.find(p => p.id === personId)
  if (!person) return null

  return {
    ...person,
    isRoot: calculateIsRoot(personId, data.children)
  }
}

/**
 * Get all root persons in the family tree
 */
export function getRootPersons(data: FamilyTree): Person[] {
  return data.persons.filter(person => 
    calculateIsRoot(person.id, data.children)
  )
}

/**
 * Check if a person will become root after a specific ChildLink is removed
 */
export function willBecomeRootAfterChildLinkRemoval(
  personId: string, 
  childLinkToRemove: ChildLink, 
  data: FamilyTree
): boolean {
  const remainingChildLinks = data.children.filter(child => 
    child.childId !== childLinkToRemove.childId || child.marriageId !== childLinkToRemove.marriageId
  )
  
  return calculateIsRoot(personId, remainingChildLinks)
}
