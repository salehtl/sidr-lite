import { describe, it, expect } from 'vitest'
import {
  calculateDeletionImpact,
  getDeletionSummary,
  canDeletePerson
} from './deletionHelpers'
import type { DeletionImpact } from './deletionHelpers'
import { testScenarios, createMockFamilyTree, createMockPerson, createMockMarriage, createMockChildLink } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('calculateDeletionImpact', () => {
  it('should calculate impact for person with no relationships', () => {
    const data = testScenarios.singlePerson()
    const impact = calculateDeletionImpact('person1', data)
    
    expect(impact.person.id).toBe('person1')
    expect(impact.marriagesToDelete).toHaveLength(0)
    expect(impact.childLinksToDelete).toHaveLength(0)
    expect(impact.orphanedChildren).toHaveLength(0)
    expect(impact.totalAffectedRecords).toBe(1)
  })

  it('should calculate impact for person with marriage but no children', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
      ],
      children: [],
    }
    
    const impact = calculateDeletionImpact('person1', data)
    
    expect(impact.person.id).toBe('person1')
    expect(impact.marriagesToDelete).toHaveLength(1)
    expect(impact.marriagesToDelete[0].id).toBe('marriage1')
    expect(impact.childLinksToDelete).toHaveLength(0)
    expect(impact.orphanedChildren).toHaveLength(0)
    expect(impact.totalAffectedRecords).toBe(2)
  })

  it('should calculate impact for person with children', () => {
    const data = testScenarios.simpleFamily()
    const impact = calculateDeletionImpact('father', data)
    
    expect(impact.person.id).toBe('father')
    expect(impact.marriagesToDelete).toHaveLength(1)
    expect(impact.marriagesToDelete[0].id).toBe('marriage-1')
    expect(impact.childLinksToDelete).toHaveLength(2)
    expect(impact.childLinksToDelete.map(c => c.childId)).toEqual(['child1', 'child2'])
    expect(impact.orphanedChildren).toHaveLength(2)
    expect(impact.orphanedChildren.map(c => c.id)).toEqual(['child1', 'child2'])
    expect(impact.totalAffectedRecords).toBe(6) // 1 person + 1 marriage + 2 child links + 2 orphaned children
  })

  it('should calculate impact for person with multiple marriages', () => {
    const data = testScenarios.polygamousFamily()
    const impact = calculateDeletionImpact('husband', data)
    
    expect(impact.person.id).toBe('husband')
    expect(impact.marriagesToDelete).toHaveLength(2)
    expect(impact.marriagesToDelete.map(m => m.id)).toEqual(['marriage-1', 'marriage-2'])
    expect(impact.childLinksToDelete).toHaveLength(2)
    expect(impact.childLinksToDelete.map(c => c.childId)).toEqual(['child1', 'child2'])
    expect(impact.orphanedChildren).toHaveLength(2)
    expect(impact.orphanedChildren.map(c => c.id)).toEqual(['child1', 'child2'])
    expect(impact.totalAffectedRecords).toBe(7) // 1 person + 2 marriages + 2 child links + 2 orphaned children
  })

  it('should not orphan children with other parents', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'father1', name: 'Father 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'father2', name: 'Father 2', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'father1', wifeId: 'mother' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'father2', wifeId: 'mother' }),
      ],
      children: [
        createMockChildLink({ childId: 'child', marriageId: 'marriage1' }),
        createMockChildLink({ childId: 'child', marriageId: 'marriage2' }),
      ],
    }
    
    const impact = calculateDeletionImpact('father1', data)
    
    expect(impact.person.id).toBe('father1')
    expect(impact.marriagesToDelete).toHaveLength(1)
    expect(impact.marriagesToDelete[0].id).toBe('marriage1')
    expect(impact.childLinksToDelete).toHaveLength(1)
    expect(impact.childLinksToDelete[0].childId).toBe('child')
    expect(impact.orphanedChildren).toHaveLength(0) // Child still has father2 as parent
    expect(impact.totalAffectedRecords).toBe(3) // 1 person + 1 marriage + 1 child link + 0 orphaned children
  })

  it('should throw error for non-existent person', () => {
    const data = testScenarios.simpleFamily()
    
    expect(() => calculateDeletionImpact('non-existent', data)).toThrow('Person not found')
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    
    expect(() => calculateDeletionImpact('person1', data)).toThrow('Person not found')
  })
})

describe('getDeletionSummary', () => {
  it('should return summary for person with no relationships', () => {
    const impact: DeletionImpact = {
      person: createMockPerson({ id: 'person1' }),
      marriagesToDelete: [],
      childLinksToDelete: [],
      orphanedChildren: [],
      totalAffectedRecords: 1
    }
    
    const summary = getDeletionSummary(impact)
    expect(summary).toBe('No relationships to delete')
  })

  it('should return summary for person with marriage', () => {
    const impact: DeletionImpact = {
      person: createMockPerson({ id: 'person1' }),
      marriagesToDelete: [createMockMarriage({ id: 'marriage1' })],
      childLinksToDelete: [],
      orphanedChildren: [],
      totalAffectedRecords: 2
    }
    
    const summary = getDeletionSummary(impact)
    expect(summary).toBe('Will delete: 1 marriage')
  })

  it('should return summary for person with multiple marriages', () => {
    const impact: DeletionImpact = {
      person: createMockPerson({ id: 'person1' }),
      marriagesToDelete: [
        createMockMarriage({ id: 'marriage1' }),
        createMockMarriage({ id: 'marriage2' })
      ],
      childLinksToDelete: [],
      orphanedChildren: [],
      totalAffectedRecords: 3
    }
    
    const summary = getDeletionSummary(impact)
    expect(summary).toBe('Will delete: 2 marriages')
  })

  it('should return summary for person with children', () => {
    const impact: DeletionImpact = {
      person: createMockPerson({ id: 'person1' }),
      marriagesToDelete: [createMockMarriage({ id: 'marriage1' })],
      childLinksToDelete: [
        createMockChildLink({ childId: 'child1', marriageId: 'marriage1' }),
        createMockChildLink({ childId: 'child2', marriageId: 'marriage1' })
      ],
      orphanedChildren: [
        createMockPerson({ id: 'child1' }),
        createMockPerson({ id: 'child2' })
      ],
      totalAffectedRecords: 6
    }
    
    const summary = getDeletionSummary(impact)
    expect(summary).toBe('Will delete: 1 marriage, 2 child relationships, 2 orphaned children')
  })

  it('should return summary for person with single child', () => {
    const impact: DeletionImpact = {
      person: createMockPerson({ id: 'person1' }),
      marriagesToDelete: [createMockMarriage({ id: 'marriage1' })],
      childLinksToDelete: [createMockChildLink({ childId: 'child1', marriageId: 'marriage1' })],
      orphanedChildren: [createMockPerson({ id: 'child1' })],
      totalAffectedRecords: 4
    }
    
    const summary = getDeletionSummary(impact)
    expect(summary).toBe('Will delete: 1 marriage, 1 child relationship, 1 orphaned child')
  })
})

describe('canDeletePerson', () => {
  it('should allow deletion of person with relationships', () => {
    const data = testScenarios.simpleFamily()
    const result = canDeletePerson('father', data)
    
    expect(result.canDelete).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('should allow deletion of person with no relationships', () => {
    const data = testScenarios.singlePerson()
    const result = canDeletePerson('person1', data)
    
    expect(result.canDelete).toBe(true)
    expect(result.reason).toBe('This is the last person in your tree')
  })

  it('should not allow deletion of non-existent person', () => {
    const data = testScenarios.simpleFamily()
    const result = canDeletePerson('non-existent', data)
    
    expect(result.canDelete).toBe(false)
    expect(result.reason).toBe('Person not found')
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = canDeletePerson('person1', data)
    
    expect(result.canDelete).toBe(false)
    expect(result.reason).toBe('Person not found')
  })
})

describe('Edge cases and complex scenarios', () => {
  it('should handle person with multiple marriages and children', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
        createMockPerson({ id: 'child2', name: 'Child 2', gender: 'F', isRoot: false }),
        createMockPerson({ id: 'child3', name: 'Child 3', gender: 'M', isRoot: false }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'husband', wifeId: 'wife2' }),
      ],
      children: [
        createMockChildLink({ childId: 'child1', marriageId: 'marriage1' }),
        createMockChildLink({ childId: 'child2', marriageId: 'marriage1' }),
        createMockChildLink({ childId: 'child3', marriageId: 'marriage2' }),
      ],
    }
    
    const impact = calculateDeletionImpact('husband', data)
    
    expect(impact.person.id).toBe('husband')
    expect(impact.marriagesToDelete).toHaveLength(2)
    expect(impact.childLinksToDelete).toHaveLength(3)
    expect(impact.orphanedChildren).toHaveLength(3)
    expect(impact.orphanedChildren.map(c => c.id)).toEqual(['child1', 'child2', 'child3'])
    expect(impact.totalAffectedRecords).toBe(9) // 1 person + 2 marriages + 3 child links + 3 orphaned children
  })

  it('should handle person with step-children correctly', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'stepfather', name: 'Stepfather', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'biological_father', name: 'Biological Father', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'biological_father', wifeId: 'mother' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'stepfather', wifeId: 'mother' }),
      ],
      children: [
        createMockChildLink({ childId: 'child', marriageId: 'marriage1' }), // Child of biological father
        createMockChildLink({ childId: 'child', marriageId: 'marriage2' }), // Step-child of stepfather
      ],
    }
    
    const impact = calculateDeletionImpact('stepfather', data)
    
    expect(impact.person.id).toBe('stepfather')
    expect(impact.marriagesToDelete).toHaveLength(1)
    expect(impact.marriagesToDelete[0].id).toBe('marriage2')
    expect(impact.childLinksToDelete).toHaveLength(1)
    expect(impact.childLinksToDelete[0].childId).toBe('child')
    expect(impact.orphanedChildren).toHaveLength(0) // Child still has biological father
    expect(impact.totalAffectedRecords).toBe(3) // 1 person + 1 marriage + 1 child link + 0 orphaned children
  })

  it('should handle person with grandchildren', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'grandfather', name: 'Grandfather', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'grandmother', name: 'Grandmother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: false }),
        createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'grandfather', wifeId: 'grandmother' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'father', wifeId: 'mother' }),
      ],
      children: [
        createMockChildLink({ childId: 'father', marriageId: 'marriage1' }),
        createMockChildLink({ childId: 'child', marriageId: 'marriage2' }),
      ],
    }
    
    const impact = calculateDeletionImpact('grandfather', data)
    
    expect(impact.person.id).toBe('grandfather')
    expect(impact.marriagesToDelete).toHaveLength(1)
    expect(impact.marriagesToDelete[0].id).toBe('marriage1')
    expect(impact.childLinksToDelete).toHaveLength(1)
    expect(impact.childLinksToDelete[0].childId).toBe('father')
    expect(impact.orphanedChildren).toHaveLength(1)
    expect(impact.orphanedChildren[0].id).toBe('father')
    expect(impact.totalAffectedRecords).toBe(4) // 1 person + 1 marriage + 1 child link + 1 orphaned child
  })

  it('should handle performance with large family trees', () => {
    // Create a large family tree with 1000 persons
    const persons = []
    const marriages = []
    const children = []
    
    for (let i = 0; i < 1000; i++) {
      persons.push(createMockPerson({ 
        id: `person${i}`,
        name: `Person ${i}`,
        gender: i % 2 === 0 ? 'M' : 'F' as const,
        isRoot: i === 0
      }))
      
      if (i > 0) {
        marriages.push(createMockMarriage({
          id: `marriage${i}`,
          husbandId: 'person0',
          wifeId: `person${i}`
        }))
        
        children.push(createMockChildLink({
          childId: `person${i}`,
          marriageId: `marriage${i}`
        }))
      }
    }
    
    const data: FamilyTree = {
      version: 2,
      persons,
      marriages,
      children,
    }
    
    const start = Date.now()
    const impact = calculateDeletionImpact('person0', data)
    const end = Date.now()
    
    // Should complete reasonably quickly (less than 200ms for 1000 persons)
    expect(end - start).toBeLessThan(200)
    
    expect(impact.person.id).toBe('person0')
    expect(impact.marriagesToDelete).toHaveLength(999)
    expect(impact.childLinksToDelete).toHaveLength(999)
    expect(impact.orphanedChildren).toHaveLength(999)
    expect(impact.totalAffectedRecords).toBe(2998) // 1 person + 999 marriages + 999 child links + 999 orphaned children
  })
})
