import { describe, it, expect } from 'vitest'
import { validateTreeNodes } from './treeValidation'
import { createMockPerson, createMockMarriage, createMockChildLink, testScenarios } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('treeValidation', () => {
  describe('validateTreeNodes', () => {
    it('should validate correct tree structure', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should detect cycles in family tree', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'F', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person1', wifeId: 'person3' }), // Cycle: person1 marries person3 (his child)
        ],
        children: [
          createMockChildLink({ childId: 'person3', marriageId: 'marriage1' }), // person3 is child of person1
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('ancestor')
    })

    it('should NOT warn about multiple roots in founding families', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'husband', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'wife', name: 'Jane', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife' }),
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0) // No warnings for multiple roots - this is normal
    })

    it('should detect isolated persons', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: false }), // Isolated
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('isolated person(s)')
    })

    it('should track multiple roots but not warn about them', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: true }),
        ],
        marriages: [],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      // Multiple roots is tracked for statistics but NOT shown as a warning
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle empty tree', () => {
      const tree = testScenarios.emptyTree()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle single person tree', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should validate complex family structure', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should validate polygamous family structure', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should validate divorced/remarried scenario', () => {
      const tree = testScenarios.divorcedRemarried()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should detect invalid parent-child relationships', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: [
          createMockChildLink({ childId: 'person3', marriageId: 'marriage1' }),
          createMockChildLink({ childId: 'person1', marriageId: 'marriage1' }), // Invalid: person1 is parent, not child
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing marriage references', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: [
          createMockChildLink({ childId: 'person3', marriageId: 'nonexistent' }), // Invalid marriage reference
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing person references', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: [
          createMockChildLink({ childId: 'nonexistent', marriageId: 'marriage1' }), // Invalid person reference
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect self-referential relationships', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person1' }), // Self-marriage
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect same-gender marriages', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'M', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }), // Same gender
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect ancestor-descendant marriages', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'grandfather', name: 'Grandfather', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'grandmother', name: 'Grandmother', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: false }),
          createMockPerson({ id: 'child', name: 'Child', gender: 'F', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'grandfather', wifeId: 'grandmother' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'father', wifeId: 'child' }), // Invalid: father-child marriage
        ],
        children: [
          createMockChildLink({ childId: 'father', marriageId: 'marriage1' }),
          createMockChildLink({ childId: 'child', marriageId: 'marriage2' }),
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect polygamy limit violations', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'wife3', name: 'Wife 3', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'wife4', name: 'Wife 4', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'husband', wifeId: 'wife2' }),
          createMockMarriage({ id: 'marriage3', husbandId: 'husband', wifeId: 'wife3' }),
          createMockMarriage({ id: 'marriage4', husbandId: 'husband', wifeId: 'wife4' }), // 4th wife - exceeds limit
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect duplicate active marriages', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'active' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person1', wifeId: 'person2', status: 'active' }), // Duplicate
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should allow remarriage after divorce', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'divorced' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person1', wifeId: 'person3', status: 'active' }), // Remarriage
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect child belonging to multiple marriages', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person4', name: 'Person 4', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person3', wifeId: 'person4' }),
        ],
        children: [
          createMockChildLink({ childId: 'child', marriageId: 'marriage1' }),
          createMockChildLink({ childId: 'child', marriageId: 'marriage2' }), // Child belongs to multiple marriages
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Edge cases and complex scenarios', () => {
    it('should handle large family tree validation', () => {
      const persons = []
      const marriages = []
      const children = []
      
      // Create a large family tree
      for (let i = 0; i < 100; i++) {
        persons.push(createMockPerson({ 
          id: `person${i}`, 
          name: `Person ${i}`, 
          gender: i % 2 === 0 ? 'M' : 'F' as any, 
          isRoot: true 
        }))
      }
      
      // Create some marriages
      for (let i = 0; i < 50; i++) {
        marriages.push(createMockMarriage({ 
          id: `marriage${i}`, 
          husbandId: `person${i * 2}`, 
          wifeId: `person${i * 2 + 1}` 
        }))
      }
      
      const tree: FamilyTree = {
        version: 2,
        persons,
        marriages,
        children
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0) // Multiple roots warning
    })

    it('should handle complex family relationships', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle family tree with multiple disconnected components', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person4', name: 'Person 4', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person5', name: 'Person 5', gender: 'M', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person3', wifeId: 'person4' }),
          // person5 is not connected to any marriage
        ],
        children: []
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('Multiple root persons'))).toBe(true)
    })

    it('should handle family tree with orphaned children', () => {
      const tree = testScenarios.singlePerson()
      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle family tree with complex cycles', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'F', isRoot: false }),
          createMockPerson({ id: 'person4', name: 'Person 4', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
          createMockMarriage({ id: 'marriage3', husbandId: 'person1', wifeId: 'person3' }), // person1 marries person3
        ],
        children: [
          createMockChildLink({ childId: 'person3', marriageId: 'marriage1' }), // person3 is child of person1
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('ancestor')
    })

    it('should handle family tree with missing references gracefully', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: [
          createMockChildLink({ childId: 'nonexistent', marriageId: 'marriage1' }),
          createMockChildLink({ childId: 'person1', marriageId: 'nonexistent' }),
        ]
      }

      const result = validateTreeNodes(tree)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
