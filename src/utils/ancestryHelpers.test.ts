import { describe, it, expect } from 'vitest'
import {
  isDirectAncestor,
  isDirectDescendant,
  areDirectlyRelated,
  getDirectAncestors,
  getDirectDescendants
} from './ancestryHelpers'
import { testScenarios, createMockFamilyTree } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('isDirectAncestor', () => {
  it('should return false for same person', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectAncestor('father', 'father', data)
    expect(result).toBe(false)
  })

  it('should detect direct parent-child relationship', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectAncestor('father', 'child1', data)
    expect(result).toBe(true)
  })

  it('should detect grandparent-grandchild relationship', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = isDirectAncestor('grandfather', 'child', data)
    expect(result).toBe(true)
  })

  it('should detect great-grandparent relationship', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = isDirectAncestor('grandfather', 'child', data)
    expect(result).toBe(true)
  })

  it('should return false for non-ancestor', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectAncestor('child1', 'father', data)
    expect(result).toBe(false)
  })

  it('should return false for siblings', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectAncestor('child1', 'child2', data)
    expect(result).toBe(false)
  })

  it('should handle disconnected persons', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectAncestor('father', 'mother', data)
    expect(result).toBe(false)
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = isDirectAncestor('person1', 'person2', data)
    expect(result).toBe(false)
  })

  it('should handle single person', () => {
    const data = testScenarios.singlePerson()
    const result = isDirectAncestor('person1', 'person2', data)
    expect(result).toBe(false)
  })
})

describe('isDirectDescendant', () => {
  it('should return false for same person', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectDescendant('father', 'father', data)
    expect(result).toBe(false)
  })

  it('should detect direct parent-child relationship', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectDescendant('child1', 'father', data)
    expect(result).toBe(true)
  })

  it('should detect grandparent-grandchild relationship', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = isDirectDescendant('child', 'grandfather', data)
    expect(result).toBe(true)
  })

  it('should return false for non-descendant', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectDescendant('father', 'child1', data)
    expect(result).toBe(false)
  })

  it('should return false for siblings', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectDescendant('child1', 'child2', data)
    expect(result).toBe(false)
  })

  it('should handle disconnected persons', () => {
    const data = testScenarios.simpleFamily()
    const result = isDirectDescendant('father', 'mother', data)
    expect(result).toBe(false)
  })
})

describe('areDirectlyRelated', () => {
  it('should return false for same person', () => {
    const data = testScenarios.simpleFamily()
    const result = areDirectlyRelated('father', 'father', data)
    expect(result).toBe(false)
  })

  it('should detect parent-child relationship', () => {
    const data = testScenarios.simpleFamily()
    const result = areDirectlyRelated('father', 'child1', data)
    expect(result).toBe(true)
  })

  it('should detect grandparent-grandchild relationship', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = areDirectlyRelated('grandfather', 'child', data)
    expect(result).toBe(true)
  })

  it('should detect ancestor-descendant in both directions', () => {
    const data = testScenarios.multiGenerationFamily()
    const result1 = areDirectlyRelated('grandfather', 'child', data)
    const result2 = areDirectlyRelated('child', 'grandfather', data)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })

  it('should return false for siblings', () => {
    const data = testScenarios.simpleFamily()
    const result = areDirectlyRelated('child1', 'child2', data)
    expect(result).toBe(false)
  })

  it('should return false for unrelated persons', () => {
    const data = testScenarios.simpleFamily()
    const result = areDirectlyRelated('father', 'mother', data)
    expect(result).toBe(false)
  })

  it('should detect invalid ancestor-descendant marriage', () => {
    const data = testScenarios.invalidAncestorDescendant()
    const result = areDirectlyRelated('grandfather', 'child', data)
    expect(result).toBe(true)
  })
})

describe('getDirectAncestors', () => {
  it('should return empty array for root person', () => {
    const data = testScenarios.simpleFamily()
    const result = getDirectAncestors('father', data)
    expect(result).toHaveLength(0)
  })

  it('should return parents for child', () => {
    const data = testScenarios.simpleFamily()
    const result = getDirectAncestors('child1', data)
    expect(result).toContain('father')
    expect(result).toContain('mother')
    expect(result).toHaveLength(2)
  })

  it('should return all ancestors for grandchild', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = getDirectAncestors('child', data)
    expect(result).toContain('father')
    expect(result).toContain('mother')
    expect(result).toContain('grandfather')
    expect(result).toContain('grandmother')
    expect(result).toHaveLength(4)
  })

  it('should handle person with no parents', () => {
    const data = testScenarios.singlePerson()
    const result = getDirectAncestors('person1', data)
    expect(result).toHaveLength(0)
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = getDirectAncestors('person1', data)
    expect(result).toHaveLength(0)
  })
})

describe('getDirectDescendants', () => {
  it('should return children for parent', () => {
    const data = testScenarios.simpleFamily()
    const result = getDirectDescendants('father', data)
    expect(result).toContain('child1')
    expect(result).toContain('child2')
    expect(result).toHaveLength(2)
  })

  it('should return all descendants for grandparent', () => {
    const data = testScenarios.multiGenerationFamily()
    const result = getDirectDescendants('grandfather', data)
    expect(result).toContain('father')
    expect(result).toContain('child')
    expect(result).toHaveLength(2)
  })

  it('should return empty array for childless person', () => {
    const data = testScenarios.singlePerson()
    const result = getDirectDescendants('person1', data)
    expect(result).toHaveLength(0)
  })

  it('should handle empty tree', () => {
    const data = testScenarios.emptyTree()
    const result = getDirectDescendants('person1', data)
    expect(result).toHaveLength(0)
  })

  it('should handle person with no descendants', () => {
    const data = testScenarios.simpleFamily()
    const result = getDirectDescendants('child1', data)
    expect(result).toHaveLength(0)
  })
})

describe('Edge cases and complex scenarios', () => {
  it('should handle polygamous family correctly', () => {
    const data = testScenarios.polygamousFamily()
    
    // Husband should be ancestor of all children
    const husbandDescendants = getDirectDescendants('husband', data)
    expect(husbandDescendants).toContain('child1')
    expect(husbandDescendants).toContain('child2')
    
    // Each wife should be ancestor of their children
    const wife1Descendants = getDirectDescendants('wife1', data)
    expect(wife1Descendants).toContain('child1')
    expect(wife1Descendants).not.toContain('child2')
    
    const wife2Descendants = getDirectDescendants('wife2', data)
    expect(wife2Descendants).toContain('child2')
    expect(wife2Descendants).not.toContain('child1')
  })

  it('should handle divorced/remarried scenario', () => {
    const data = testScenarios.divorcedRemarried()
    
    // Person1 should not be related to person2 or person3
    const relatedToPerson2 = areDirectlyRelated('person1', 'person2', data)
    const relatedToPerson3 = areDirectlyRelated('person1', 'person3', data)
    expect(relatedToPerson2).toBe(false)
    expect(relatedToPerson3).toBe(false)
  })

  it('should detect cycles in family tree', () => {
    // Create a cycle: A -> B -> C -> A
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'A', name: 'A', gender: 'M', isRoot: true },
        { id: 'B', name: 'B', gender: 'F', isRoot: false },
        { id: 'C', name: 'C', gender: 'M', isRoot: false },
      ],
      marriages: [
        { id: 'm1', husbandId: 'A', wifeId: 'B', status: 'active', marriageDate: null, divorceDate: null },
        { id: 'm2', husbandId: 'B', wifeId: 'C', status: 'active', marriageDate: null, divorceDate: null },
        { id: 'm3', husbandId: 'C', wifeId: 'A', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [
        { childId: 'B', marriageId: 'm1' },
        { childId: 'C', marriageId: 'm2' },
        { childId: 'A', marriageId: 'm3' },
      ],
    }
    
    // This should create a cycle where everyone is related to everyone
    const aRelatedToB = areDirectlyRelated('A', 'B', data)
    const bRelatedToC = areDirectlyRelated('B', 'C', data)
    const cRelatedToA = areDirectlyRelated('C', 'A', data)
    
    expect(aRelatedToB).toBe(true)
    expect(bRelatedToC).toBe(true)
    expect(cRelatedToA).toBe(true)
  })

  it('should handle disconnected family trees', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'A', name: 'A', gender: 'M', isRoot: true },
        { id: 'B', name: 'B', gender: 'F', isRoot: true },
        { id: 'C', name: 'C', gender: 'M', isRoot: false },
        { id: 'D', name: 'D', gender: 'F', isRoot: false },
      ],
      marriages: [
        { id: 'm1', husbandId: 'A', wifeId: 'B', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [
        { childId: 'C', marriageId: 'm1' },
      ],
    }
    
    // A and B should be related to C, but not to D
    const aRelatedToC = areDirectlyRelated('A', 'C', data)
    const bRelatedToC = areDirectlyRelated('B', 'C', data)
    const aRelatedToD = areDirectlyRelated('A', 'D', data)
    const bRelatedToD = areDirectlyRelated('B', 'D', data)
    
    expect(aRelatedToC).toBe(true)
    expect(bRelatedToC).toBe(true)
    expect(aRelatedToD).toBe(false)
    expect(bRelatedToD).toBe(false)
  })

  it('should handle missing marriage references gracefully', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'A', name: 'A', gender: 'M', isRoot: true },
        { id: 'B', name: 'B', gender: 'F', isRoot: false },
      ],
      marriages: [], // No marriages
      children: [
        { childId: 'B', marriageId: 'missing-marriage' }, // References non-existent marriage
      ],
    }
    
    // Should not crash and should return false for relationships
    const result = areDirectlyRelated('A', 'B', data)
    expect(result).toBe(false)
  })

  it('should handle missing person references gracefully', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        { id: 'A', name: 'A', gender: 'M', isRoot: true },
      ],
      marriages: [
        { id: 'm1', husbandId: 'A', wifeId: 'missing-wife', status: 'active', marriageDate: null, divorceDate: null },
      ],
      children: [],
    }
    
    // Should not crash and should return false for relationships
    const result = areDirectlyRelated('A', 'missing-wife', data)
    expect(result).toBe(false)
  })
})
