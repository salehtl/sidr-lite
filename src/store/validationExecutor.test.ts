import { describe, it, expect, vi } from 'vitest'
import { executeValidation, validateAndCommit } from './validationExecutor'
import { createMockFamilyTree, testScenarios } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('Validation Execution Model (Section 7)', () => {
  describe('executeValidation', () => {
    it('should follow clone-mutate-validate-commit flow', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = executeValidation(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'New Person',
            gender: 'M',
            isRoot: true
          }]
        })
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.multipleRoots).toBe(true)
    })

    it('should reject on hard invariant failure', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = executeValidation(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'A', // Too short
            gender: 'M',
            isRoot: false
          }]
        })
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.message.includes('name must be at least 2 characters'))).toBe(true)
    })

    it('should commit and surface warnings on success', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = executeValidation(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [
            ...tree.persons,
            {
              id: 'new-person-1',
              name: 'New Person 1',
              gender: 'M',
              isRoot: true
            },
            {
              id: 'new-person-2',
              name: 'New Person 2',
              gender: 'F',
              isRoot: true
            }
          ]
        })
      )
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.multipleRoots).toBe(true)
      expect(result.warnings.rootCount).toBeGreaterThan(1)
    })

    it('should recalculate derived values', () => {
      const currentTree = testScenarios.singlePerson()
      
      const result = executeValidation(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'New Person',
            gender: 'M',
            isRoot: true
          }]
        })
      )
      
      expect(result.isValid).toBe(true)
      // The new person should be a root
      expect(result.warnings.multipleRoots).toBe(true)
    })
  })

  describe('validateAndCommit', () => {
    it('should commit valid operations', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = validateAndCommit(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'New Person',
            gender: 'M',
            isRoot: false
          }]
        })
      )
      
      expect(result.persons.length).toBe(currentTree.persons.length + 1)
      expect(result.persons.some(p => p.id === 'new-person')).toBe(true)
    })

    it('should throw on validation failure', () => {
      const currentTree = testScenarios.simpleFamily()
      
      expect(() => {
        validateAndCommit(
          currentTree,
          (tree) => ({
            ...tree,
            persons: [...tree.persons, {
              id: 'new-person',
              name: 'A', // Too short
              gender: 'M',
              isRoot: false
            }]
          })
        )
      }).toThrow('Validation failed')
    })

    it('should surface warnings when callback provided', () => {
      const currentTree = testScenarios.simpleFamily()
      const onWarnings = vi.fn()
      
      validateAndCommit(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [
            ...tree.persons,
            {
              id: 'new-person-1',
              name: 'New Person 1',
              gender: 'M',
              isRoot: true
            },
            {
              id: 'new-person-2',
              name: 'New Person 2',
              gender: 'F',
              isRoot: true
            }
          ]
        }),
        onWarnings
      )
      
      expect(onWarnings).toHaveBeenCalledWith(
        expect.objectContaining({
          multipleRoots: true,
          rootCount: expect.any(Number)
        })
      )
    })

    it('should not call warning callback when no warnings', () => {
      const currentTree = testScenarios.singlePerson()
      const onWarnings = vi.fn()
      
      validateAndCommit(
        currentTree,
        (tree) => ({
          ...tree,
          persons: tree.persons.map(p => ({
            ...p,
            name: 'Updated Name'
          }))
        }),
        onWarnings
      )
      
      expect(onWarnings).not.toHaveBeenCalled()
    })

    it('should handle complex family tree mutations', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = validateAndCommit(
        currentTree,
        (tree) => {
          // Add a new person
          const newPerson = {
            id: 'new-person',
            name: 'New Person',
            gender: 'F' as const,
            isRoot: true
          }
          
          // Add a new marriage between existing father and new person
          const newMarriage = {
            id: 'new-marriage',
            husbandId: 'father',
            wifeId: newPerson.id,
            status: 'active' as const,
            marriageDate: null,
            divorceDate: null
          }
          
          return {
            ...tree,
            persons: [...tree.persons, newPerson],
            marriages: [...tree.marriages, newMarriage]
          }
        }
      )
      
      expect(result.persons.length).toBe(currentTree.persons.length + 1)
      expect(result.marriages.length).toBe(currentTree.marriages.length + 1)
    })

    it('should handle empty tree operations', () => {
      const emptyTree: FamilyTree = {
        version: 1,
        persons: [],
        marriages: [],
        children: []
      }
      
      const result = validateAndCommit(
        emptyTree,
        (tree) => ({
          ...tree,
          persons: [{
            id: 'first-person',
            name: 'First Person',
            gender: 'M',
            isRoot: true
          }]
        })
      )
      
      expect(result.persons.length).toBe(1)
      expect(result.persons[0].isRoot).toBe(true)
    })

    it('should handle large family tree operations', () => {
      const largeTree = testScenarios.polygamousFamily()
      
      const result = validateAndCommit(
        largeTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'New Person',
            gender: 'M',
            isRoot: false
          }]
        })
      )
      
      expect(result.persons.length).toBe(largeTree.persons.length + 1)
      expect(result.persons.some(p => p.id === 'new-person')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should provide detailed error messages', () => {
      const currentTree = testScenarios.simpleFamily()
      
      expect(() => {
        validateAndCommit(
          currentTree,
          (tree) => ({
            ...tree,
            persons: [...tree.persons, {
              id: 'new-person',
              name: 'A', // Too short
              gender: 'U' as any, // Invalid gender
              isRoot: false
            }]
          })
        )
      }).toThrow(/Validation failed.*name must be at least 2 characters.*gender must be M or F/)
    })

    it('should handle multiple validation errors', () => {
      const currentTree = testScenarios.simpleFamily()
      
      const result = executeValidation(
        currentTree,
        (tree) => ({
          ...tree,
          persons: [
            ...tree.persons,
            {
              id: 'father', // Duplicate ID (father already exists)
              name: 'A', // Too short
              gender: 'INVALID' as any, // Invalid gender
              isRoot: false
            }
          ]
        })
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors.some(e => e.message.includes('Duplicate person ID'))).toBe(true)
      expect(result.errors.some(e => e.message.includes('name must be at least 2 characters'))).toBe(true)
      expect(result.errors.some(e => e.message.includes('gender must be M or F'))).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should handle operations efficiently', () => {
      const largeTree = testScenarios.polygamousFamily()
      const startTime = performance.now()
      
      const result = validateAndCommit(
        largeTree,
        (tree) => ({
          ...tree,
          persons: [...tree.persons, {
            id: 'new-person',
            name: 'New Person',
            gender: 'M',
            isRoot: false
          }]
        })
      )
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      expect(result.persons.length).toBe(largeTree.persons.length + 1)
      expect(executionTime).toBeLessThan(100) // Should complete within 100ms
    })
  })
})
