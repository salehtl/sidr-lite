import type { FamilyTree } from '../types/domain'
import { validateFamilyTree } from '../store/validators'

export interface TreeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  nodeErrors: Record<string, string[]>
}

export function validateTreeNodes(data: FamilyTree): TreeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeErrors: Record<string, string[]> = {}
  
  // Validate overall tree structure
  const treeValidation = validateFamilyTree(data)
  if (treeValidation.length > 0) {
    errors.push(...treeValidation.map(e => e.message))
  }
  
  // Check for orphaned persons
  data.persons.forEach(person => {
    const hasParents = data.children.some(child => child.childId === person.id)
    const hasSpouse = data.marriages.some(marriage => 
      marriage.husbandId === person.id || marriage.wifeId === person.id
    )
    const hasChildren = data.children.some(child => {
      const marriage = data.marriages.find(m => m.id === child.marriageId)
      return marriage && (marriage.husbandId === person.id || marriage.wifeId === person.id)
    })
    
    if (!hasParents && !hasSpouse && !hasChildren && !person.isRoot) {
      nodeErrors[person.id] = nodeErrors[person.id] || []
      nodeErrors[person.id].push('Person is not connected to the family tree')
    }
  })
  
  // Check for invalid marriages
  data.marriages.forEach(marriage => {
    const husband = data.persons.find(p => p.id === marriage.husbandId)
    const wife = data.persons.find(p => p.id === marriage.wifeId)
    
    if (!husband || !wife) {
      errors.push(`Marriage ${marriage.id} references non-existent persons`)
    } else {
      // Check gender compatibility
      if (husband.gender === wife.gender && husband.gender !== 'U') {
        nodeErrors[marriage.id] = nodeErrors[marriage.id] || []
        nodeErrors[marriage.id].push('Invalid marriage: same gender')
      }
      
      // Check for self-marriage
      if (husband.id === wife.id) {
        nodeErrors[marriage.id] = nodeErrors[marriage.id] || []
        nodeErrors[marriage.id].push('Invalid marriage: person cannot marry themselves')
      }
    }
  })
  
  // Check for invalid child links
  data.children.forEach(childLink => {
    const marriage = data.marriages.find(m => m.id === childLink.marriageId)
    const child = data.persons.find(p => p.id === childLink.childId)
    
    if (!marriage || !child) {
      errors.push(`Child link references non-existent marriage or person`)
    } else {
      // Check if child is actually a child of this marriage
      const husband = data.persons.find(p => p.id === marriage.husbandId)
      const wife = data.persons.find(p => p.id === marriage.wifeId)
      
      if (husband && wife && (child.id === husband.id || child.id === wife.id)) {
        nodeErrors[childLink.childId] = nodeErrors[childLink.childId] || []
        nodeErrors[childLink.childId].push('Person cannot be their own child')
      }
    }
  })
  
  // Check for multiple root persons
  const rootPersons = data.persons.filter(p => p.isRoot)
  if (rootPersons.length > 1) {
    warnings.push('Multiple root persons found')
  }
  
  // Check for circular relationships
  const circularRelationships = findCircularRelationships(data)
  if (circularRelationships.length > 0) {
    errors.push('Circular relationships detected')
    circularRelationships.forEach(cycle => {
      nodeErrors[cycle[0]] = nodeErrors[cycle[0]] || []
      nodeErrors[cycle[0]].push('Part of circular relationship')
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    nodeErrors
  }
}

function findCircularRelationships(data: FamilyTree): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  const dfs = (personId: string, path: string[]): void => {
    if (recursionStack.has(personId)) {
      // Found a cycle
      const cycleStart = path.indexOf(personId)
      cycles.push(path.slice(cycleStart))
      return
    }
    
    if (visited.has(personId)) return
    
    visited.add(personId)
    recursionStack.add(personId)
    
    // Find parents
    const parentLinks = data.children.filter(child => child.childId === personId)
    for (const link of parentLinks) {
      const marriage = data.marriages.find(m => m.id === link.marriageId)
      if (marriage) {
        const husband = data.persons.find(p => p.id === marriage.husbandId)
        const wife = data.persons.find(p => p.id === marriage.wifeId)
        
        if (husband) dfs(husband.id, [...path, husband.id])
        if (wife) dfs(wife.id, [...path, wife.id])
      }
    }
    
    // Find children
    const marriages = data.marriages.filter(m => 
      m.husbandId === personId || m.wifeId === personId
    )
    for (const marriage of marriages) {
      const children = data.children.filter(child => child.marriageId === marriage.id)
      for (const child of children) {
        const childPerson = data.persons.find(p => p.id === child.childId)
        if (childPerson) {
          dfs(childPerson.id, [...path, childPerson.id])
        }
      }
    }
    
    recursionStack.delete(personId)
  }
  
  data.persons.forEach(person => {
    if (!visited.has(person.id)) {
      dfs(person.id, [person.id])
    }
  })
  
  return cycles
}

export function getNodeValidationStatus(nodeId: string, validation: TreeValidationResult): 'valid' | 'warning' | 'error' {
  if (validation.nodeErrors[nodeId] && validation.nodeErrors[nodeId].length > 0) {
    return 'error'
  }
  return 'valid'
}

export function getValidationSummary(validation: TreeValidationResult): string {
  const parts: string[] = []
  
  if (validation.errors.length > 0) {
    parts.push(`${validation.errors.length} error${validation.errors.length > 1 ? 's' : ''}`)
  }
  
  if (validation.warnings.length > 0) {
    parts.push(`${validation.warnings.length} warning${validation.warnings.length > 1 ? 's' : ''}`)
  }
  
  if (parts.length === 0) {
    return 'All validations passed'
  }
  
  return parts.join(', ')
}
