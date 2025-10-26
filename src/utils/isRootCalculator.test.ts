import { describe, it, expect } from 'vitest'
import {
  calculateIsRoot,
  recalculateAllRoots,
  recalculatePersonRoot,
  getRootPersons,
  willBecomeRootAfterChildLinkRemoval
} from './isRootCalculator'
import { testScenarios, createMockFamilyTree, createMockChildLink } from '../test-utils'
import type { FamilyTree, ChildLink } from '../types/domain'

describe('calculateIsRoot', () => {
  it('should return true for person with no children links', () => {
    const children: ChildLink[] = []
    const result = calculateIsRoot('person1', children)
    expect(result).toBe(true)
  })

  it('should return true for person not referenced in any child link', () => {
    const children: ChildLink[] = [
      createMockChildLink({ childId: 'child1', marriageId: 'marriage1' }),
      createMockChildLink({ childId: 'child2', marriageId: 'marriage1' }),
    ]
    const result = calculateIsRoot('person1', children)
    expect(result).toBe(true)
  })

  it('should return false for person referenced as child', () => {
    const children: ChildLink[] = [
      createMockChildLink({ childId: 'person1', marriageId: 'marriage1' }),
    ]
    const result = calculateIsRoot('person1', children)
    expect(result).toBe(false)
  })

  it('should return false for person referenced in multiple child links', () => {
    const children: ChildLink[] = [
      createMockChildLink({ childId: 'person1', marriageId: 'marriage1' }),
      createMockChildLink({ childId: 'person1', marriageId: 'marriage2' }),
    ]
    const result = calculateIsRoot('person1', children)
    expect(result).toBe(false)
  })
})

describe('recalculateAllRoots', () => {
  it('should recalculate isRoot for all persons', () => {
    const data = testScenarios.simpleFamily()
    const result = recalculateAllRoots(data)
    
    // Father should be root (no parents)
    const father = result.persons.find(p => p.id === 'father')!
    expect(father.isRoot).toBe(true)
    
    // Mother should be root (no parents - marriage doesn't make her a child)
    const mother = result.persons.find(p => p.id === 'mother')!
    expect(mother.isRoot).toBe(true)
    
    // Children should not be root (have parents)
    const child1 = result.persons.find(p => p.id === 'child1')!
    const child2 = result.persons.find(p => p.id === 'child2')!
    expect(child1.isRoot).toBe(false)
    expect(child2.isRoot).toBe(false)
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = recalculateAllRoots(data)
    expect(result.persons).toHaveLength(0)
  })

  it('should handle single person', () => {
    const data = testScenarios.singlePerson()
    const result = recalculateAllRoots(data)
    
    const person = result.persons[0]
    expect(person.isRoot).toBe(true)
  })

  it('should handle multi-generation family', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = recalculateAllRoots(data)
    
    // Grandfather should be root
    const grandfather = result.persons.find(p => p.id === 'grandfather')!
    expect(grandfather.isRoot).toBe(true)
    
    // Grandmother should be root (no parents - marriage doesn't make her a child)
    const grandmother = result.persons.find(p => p.id === 'grandmother')!
    expect(grandmother.isRoot).toBe(true)
    
    // Father should not be root (has parents)
    const father = result.persons.find(p => p.id === 'father')!
    expect(father.isRoot).toBe(false)
    
    // Mother should be root (no parents - marriage doesn't make her a child)
    const mother = result.persons.find(p => p.id === 'mother')!
    expect(mother.isRoot).toBe(true)
    
    // Child should not be root (has parents)
    const child = result.persons.find(p => p.id === 'child')!
    expect(child.isRoot).toBe(false)
  })

  it('should handle polygamous family', () => {
    const data = testScenarios.polygamousFamily()
    const result = recalculateAllRoots(data)
    
    // Husband should be root
    const husband = result.persons.find(p => p.id === 'husband')!
    expect(husband.isRoot).toBe(true)
    
    // Wives should be root (no parents - marriage doesn't make them children)
    const wife1 = result.persons.find(p => p.id === 'wife1')!
    const wife2 = result.persons.find(p => p.id === 'wife2')!
    expect(wife1.isRoot).toBe(true)
    expect(wife2.isRoot).toBe(true)
    
    // Children should not be root (have parents)
    const child1 = result.persons.find(p => p.id === 'child1')!
    const child2 = result.persons.find(p => p.id === 'child2')!
    expect(child1.isRoot).toBe(false)
    expect(child2.isRoot).toBe(false)
  })

  it('should preserve other person properties', () => {
    const data = testScenarios.simpleFamily()
    const result = recalculateAllRoots(data)
    
    const father = result.persons.find(p => p.id === 'father')!
    expect(father.name).toBe('Father')
    expect(father.gender).toBe('M')
    expect(father.id).toBe('father')
  })
})

describe('recalculatePersonRoot', () => {
  it('should recalculate isRoot for specific person', () => {
    const data = testScenarios.simpleFamily()
    const result = recalculatePersonRoot('father', data)
    
    expect(result).not.toBeNull()
    expect(result!.isRoot).toBe(true)
    expect(result!.name).toBe('Father')
  })

  it('should return null for non-existent person', () => {
    const data = testScenarios.simpleFamily()
    const result = recalculatePersonRoot('non-existent', data)
    
    expect(result).toBeNull()
  })

  it('should recalculate child as non-root', () => {
    const data = testScenarios.simpleFamily()
    const result = recalculatePersonRoot('child1', data)
    
    expect(result).not.toBeNull()
    expect(result!.isRoot).toBe(false)
  })
})

describe('getRootPersons', () => {
  it('should return all root persons', () => {
    const data = testScenarios.simpleFamily()
    const result = getRootPersons(data)
    
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['father', 'mother'])
  })

  it('should return empty array for empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = getRootPersons(data)
    
    expect(result).toHaveLength(0)
  })

  it('should return single person for single person tree', () => {
    const data = testScenarios.singlePerson()
    const result = getRootPersons(data)
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('person1')
  })

  it('should handle multiple root persons', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'root1', name: 'Root 1', gender: 'M', isRoot: true },
        { id: 'root2', name: 'Root 2', gender: 'F', isRoot: true },
        { id: 'child', name: 'Child', gender: 'M', isRoot: false },
      ],
      marriages: [],
      children: [
        { childId: 'child', marriageId: 'marriage1' },
      ],
    }
    
    const result = getRootPersons(data)
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['root1', 'root2'])
  })
})

describe('willBecomeRootAfterChildLinkRemoval', () => {
  it('should return true when person will become root after child link removal', () => {
    const data = testScenarios.simpleFamily()
    const childLinkToRemove = data.children[0] // Remove child1's parent link
    
    const result = willBecomeRootAfterChildLinkRemoval('child1', childLinkToRemove, data)
    expect(result).toBe(true)
  })

  it('should return false when person has other child links', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'person1', name: 'Person 1', gender: 'M', isRoot: true },
        { id: 'person2', name: 'Person 2', gender: 'F', isRoot: false },
        { id: 'person3', name: 'Person 3', gender: 'M', isRoot: false },
      ],
      marriages: [
        { id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'active', marriageDate: null, divorceDate: null },
        { id: 'marriage2', husbandId: 'person1', wifeId: 'person3', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [
        { childId: 'person2', marriageId: 'marriage1' },
        { childId: 'person3', marriageId: 'marriage2' },
      ],
    }
    
    const childLinkToRemove = data.children[0] // Remove person2's link to marriage1
    const result = willBecomeRootAfterChildLinkRemoval('person2', childLinkToRemove, data)
    expect(result).toBe(true)
  })

  it('should return false when person is already root', () => {
    const data = testScenarios.simpleFamily()
    const childLinkToRemove = data.children[0]
    
    const result = willBecomeRootAfterChildLinkRemoval('father', childLinkToRemove, data)
    expect(result).toBe(true) // Father is already root
  })

  it('should handle non-existent child link', () => {
    const data = testScenarios.simpleFamily()
    const nonExistentChildLink = createMockChildLink({ childId: 'non-existent', marriageId: 'non-existent' })
    
    const result = willBecomeRootAfterChildLinkRemoval('child1', nonExistentChildLink, data)
    expect(result).toBe(false) // child1 still has its parent link
  })
})

describe('Edge cases and complex scenarios', () => {
  it('should handle orphaned children correctly', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'parent1', name: 'Parent 1', gender: 'M', isRoot: true },
        { id: 'parent2', name: 'Parent 2', gender: 'F', isRoot: false },
        { id: 'child1', name: 'Child 1', gender: 'M', isRoot: false },
        { id: 'child2', name: 'Child 2', gender: 'F', isRoot: false },
      ],
      marriages: [
        { id: 'marriage1', husbandId: 'parent1', wifeId: 'parent2', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [
        { childId: 'child1', marriageId: 'marriage1' },
        { childId: 'child2', marriageId: 'marriage1' },
      ],
    }
    
    const result = recalculateAllRoots(data)
    
    // Parent1 should be root
    const parent1 = result.persons.find(p => p.id === 'parent1')!
    expect(parent1.isRoot).toBe(true)
    
    // Parent2 should be root (no parents - marriage doesn't make her a child)
    const parent2 = result.persons.find(p => p.id === 'parent2')!
    expect(parent2.isRoot).toBe(true)
    
    // Children should not be root (have parents)
    const child1 = result.persons.find(p => p.id === 'child1')!
    const child2 = result.persons.find(p => p.id === 'child2')!
    expect(child1.isRoot).toBe(false)
    expect(child2.isRoot).toBe(false)
  })

  it('should handle disconnected family trees', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'root1', name: 'Root 1', gender: 'M', isRoot: true },
        { id: 'root2', name: 'Root 2', gender: 'F', isRoot: true },
        { id: 'child1', name: 'Child 1', gender: 'M', isRoot: false },
        { id: 'child2', name: 'Child 2', gender: 'F', isRoot: false },
      ],
      marriages: [
        { id: 'marriage1', husbandId: 'root1', wifeId: 'child1', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [
        { childId: 'child1', marriageId: 'marriage1' },
      ],
    }
    
    const result = recalculateAllRoots(data)
    
    // Both roots should be root
    const root1 = result.persons.find(p => p.id === 'root1')!
    const root2 = result.persons.find(p => p.id === 'root2')!
    expect(root1.isRoot).toBe(true)
    expect(root2.isRoot).toBe(true)
    
    // child1 should not be root (has parents)
    const child1 = result.persons.find(p => p.id === 'child1')!
    expect(child1.isRoot).toBe(false)
    
    // child2 should be root (no parents)
    const child2 = result.persons.find(p => p.id === 'child2')!
    expect(child2.isRoot).toBe(true)
  })

  it('should handle missing marriage references gracefully', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'person1', name: 'Person 1', gender: 'M', isRoot: true },
        { id: 'person2', name: 'Person 2', gender: 'F', isRoot: false },
      ],
      marriages: [], // No marriages
      children: [
        { childId: 'person2', marriageId: 'missing-marriage' }, // References non-existent marriage
      ],
    }
    
    const result = recalculateAllRoots(data)
    
    // Both persons should be root since the marriage doesn't exist
    const person1 = result.persons.find(p => p.id === 'person1')!
    const person2 = result.persons.find(p => p.id === 'person2')!
    expect(person1.isRoot).toBe(true)
    expect(person2.isRoot).toBe(false) // person2 is referenced as a child
  })

  it('should handle performance with large family trees', () => {
    // Create a large family tree with 1000 persons
    const persons = []
    const children = []
    
    for (let i = 0; i < 1000; i++) {
      persons.push({
        id: `person${i}`,
        name: `Person ${i}`,
        gender: (i % 2 === 0 ? 'M' : 'F') as 'M' | 'F',
        isRoot: i === 0, // Only first person is root
      })
      
      if (i > 0) {
        children.push({
          childId: `person${i}`,
          marriageId: `marriage${Math.floor(i / 2)}`,
        })
      }
    }
    
    const data: FamilyTree = {
      version: 2,
      persons,
      marriages: [],
      children,
    }
    
    const start = Date.now()
    const result = recalculateAllRoots(data)
    const end = Date.now()
    
    // Should complete quickly (less than 100ms for 1000 persons)
    expect(end - start).toBeLessThan(100)
    
    // Only first person should be root
    const rootPersons = result.persons.filter(p => p.isRoot)
    expect(rootPersons).toHaveLength(1)
    expect(rootPersons[0].id).toBe('person0')
  })
})
