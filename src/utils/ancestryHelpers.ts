import type { FamilyTree } from '../types/domain'

/**
 * Check if personId is a direct ancestor of potentialDescendantId
 * Traverses up from potentialDescendant through ChildLinks to see if personId appears
 */
export function isDirectAncestor(
  personId: string, 
  potentialDescendantId: string, 
  data: FamilyTree
): boolean {
  if (personId === potentialDescendantId) return false
  
  const visited = new Set<string>()
  const queue = [potentialDescendantId]
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)
    
    // Find parents of current person
    const childLinks = data.children.filter(child => child.childId === currentId)
    
    for (const childLink of childLinks) {
      const marriage = data.marriages.find(m => m.id === childLink.marriageId)
      if (!marriage) continue
      
      // Check if either parent is the person we're looking for
      if (marriage.husbandId === personId || marriage.wifeId === personId) {
        return true
      }
      
      // Add parents to queue for further traversal
      if (marriage.husbandId) queue.push(marriage.husbandId)
      if (marriage.wifeId) queue.push(marriage.wifeId)
    }
  }
  
  return false
}

/**
 * Check if personId is a direct descendant of potentialAncestorId
 * Traverses down from potentialAncestor through marriages and children
 */
export function isDirectDescendant(
  personId: string, 
  potentialAncestorId: string, 
  data: FamilyTree
): boolean {
  if (personId === potentialAncestorId) return false
  
  const visited = new Set<string>()
  const queue = [potentialAncestorId]
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)
    
    // Find marriages where current person is a spouse
    const marriages = data.marriages.filter(m => 
      m.husbandId === currentId || m.wifeId === currentId
    )
    
    for (const marriage of marriages) {
      // Find children of this marriage
      const childLinks = data.children.filter(child => child.marriageId === marriage.id)
      
      for (const childLink of childLinks) {
        const childId = childLink.childId
        
        // Check if this child is the person we're looking for
        if (childId === personId) {
          return true
        }
        
        // Add child to queue for further traversal
        queue.push(childId)
      }
    }
  }
  
  return false
}

/**
 * Check if two persons are directly related (ancestor-descendant relationship)
 * Returns true if person1 is ancestor of person2 OR person2 is ancestor of person1
 */
export function areDirectlyRelated(
  person1Id: string, 
  person2Id: string, 
  data: FamilyTree
): boolean {
  if (person1Id === person2Id) return false
  
  return isDirectAncestor(person1Id, person2Id, data) || 
         isDirectAncestor(person2Id, person1Id, data)
}

/**
 * Get all direct ancestors of a person (parents, grandparents, etc.)
 * Returns array of person IDs in order from immediate parents to furthest ancestors
 */
export function getDirectAncestors(personId: string, data: FamilyTree): string[] {
  const ancestors: string[] = []
  const visited = new Set<string>()
  const queue = [personId]
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)
    
    // Find parents of current person
    const childLinks = data.children.filter(child => child.childId === currentId)
    
    for (const childLink of childLinks) {
      const marriage = data.marriages.find(m => m.id === childLink.marriageId)
      if (!marriage) continue
      
      // Add parents to ancestors list and queue
      if (marriage.husbandId && !ancestors.includes(marriage.husbandId)) {
        ancestors.push(marriage.husbandId)
        queue.push(marriage.husbandId)
      }
      if (marriage.wifeId && !ancestors.includes(marriage.wifeId)) {
        ancestors.push(marriage.wifeId)
        queue.push(marriage.wifeId)
      }
    }
  }
  
  return ancestors
}

/**
 * Get all direct descendants of a person (children, grandchildren, etc.)
 * Returns array of person IDs in order from immediate children to furthest descendants
 */
export function getDirectDescendants(personId: string, data: FamilyTree): string[] {
  const descendants: string[] = []
  const visited = new Set<string>()
  const queue = [personId]
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)
    
    // Find marriages where current person is a spouse
    const marriages = data.marriages.filter(m => 
      m.husbandId === currentId || m.wifeId === currentId
    )
    
    for (const marriage of marriages) {
      // Find children of this marriage
      const childLinks = data.children.filter(child => child.marriageId === marriage.id)
      
      for (const childLink of childLinks) {
        const childId = childLink.childId
        
        if (!descendants.includes(childId)) {
          descendants.push(childId)
          queue.push(childId)
        }
      }
    }
  }
  
  return descendants
}
