import { describe, it, expect, vi } from 'vitest'
import {
  validateStagedOperation,
  applyStagedValidation
} from './stagedValidation'
import type { StagedValidationResult } from './stagedValidation'
import { testScenarios, createMockFamilyTree, createMockPerson, createMockMarriage } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('validateStagedOperation', () => {
  it('should validate correct staged operation', () => {
    const currentData = testScenarios.singlePerson()
    const stagedData = testScenarios.singlePerson()
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(true)
    expect(result.criticalErrors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should detect critical errors in staged data', () => {
    const currentData = testScenarios.singlePerson()
    const stagedData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: '', gender: 'M', isRoot: true }), // Invalid: empty name
      ],
      marriages: [],
      children: [],
    }
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(false)
    expect(result.criticalErrors.length).toBeGreaterThan(0)
  })

  it('should NOT warn about multiple roots in founding families', () => {
    const currentData = testScenarios.simpleFamily()
    const stagedData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'John', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife', name: 'Jane', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife' }),
      ],
      children: [],
    }
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(true)
    expect(result.criticalErrors).toHaveLength(0)
    // Multiple roots is NORMAL for founding families - should NOT be a warning
    expect(result.warnings).not.toContain('Multiple root persons found')
  })

  it('should detect warnings for isolated persons', () => {
    const currentData = testScenarios.simpleFamily()
    const stagedData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: false }), // Isolated
        createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: false }), // Isolated
      ],
      marriages: [],
      children: [],
    }
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(true)
    expect(result.criticalErrors).toHaveLength(0)
    expect(result.warnings).toContain('2 isolated person(s) not connected to family tree')
  })

  it('should handle empty tree', () => {
    const currentData = testScenarios.emptyTree()
    const stagedData = testScenarios.emptyTree()
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(true)
    expect(result.criticalErrors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should handle single person tree', () => {
    const currentData = testScenarios.singlePerson()
    const stagedData = testScenarios.singlePerson()
    
    const result = validateStagedOperation(currentData, stagedData)
    
    expect(result.isValid).toBe(true)
    expect(result.criticalErrors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})

describe('applyStagedValidation', () => {
  it('should apply valid operation successfully', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'new-person', name: 'New Person', gender: 'M', isRoot: true })
        ]
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.persons).toHaveLength(2)
    expect(result.persons.find(p => p.id === 'new-person')).toBeDefined()
    expect(onWarnings).toHaveBeenCalledWith(['Multiple root persons found'])
  })

  it('should throw error for invalid operation', () => {
    const currentData = testScenarios.singlePerson()
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'invalid-person', name: '', gender: 'M', isRoot: true }) // Invalid: empty name
        ]
      }
    }
    
    expect(() => applyStagedValidation(currentData, operation, onWarnings)).toThrow('Validation failed')
    expect(onWarnings).not.toHaveBeenCalled()
  })

  it('should call onWarnings for warnings', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'new-person1', name: 'New Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'new-person2', name: 'New Person 2', gender: 'F', isRoot: true }),
        ]
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.persons).toHaveLength(3)
    expect(onWarnings).toHaveBeenCalledWith(['Multiple root persons found'])
  })

  it('should handle operation without warnings callback', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'new-person', name: 'New Person', gender: 'M', isRoot: true })
        ]
      }
    }
    
    const result = applyStagedValidation(currentData, operation)
    
    expect(result.persons).toHaveLength(2)
    expect(result.persons.find(p => p.id === 'new-person')).toBeDefined()
  })

  it('should handle complex family operations', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true })
        ]
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.persons).toHaveLength(2)
    expect(result.persons.find(p => p.id === 'person2')).toBeDefined()
    expect(onWarnings).toHaveBeenCalledWith(['Multiple root persons found'])
  })

  it('should handle deletion operations', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: data.persons.filter(p => p.id !== 'person2')
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.persons).toHaveLength(1)
    expect(result.persons.find(p => p.id === 'person2')).toBeUndefined()
    expect(onWarnings).not.toHaveBeenCalled()
  })

  it('should handle data migration operations', () => {
    const currentData: FamilyTree = {
      version: 1, // Old version
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'U' as any, isRoot: true }), // Old gender
      ],
      marriages: [],
      children: [],
    }
    
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      // Migrate to new version
      return {
        ...data,
        version: 2,
        persons: data.persons.map(p => ({
          ...p,
          gender: p.gender as 'M' | 'F'
        }))
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.version).toBe(2)
    expect(result.persons[0].gender).toBe('M')
  })
})

describe('Edge cases and complex scenarios', () => {
  it('should handle large family tree operations', () => {
    // Create a large family tree with simple structure
    const persons = []
    
    for (let i = 0; i < 100; i++) {
      persons.push(createMockPerson({ 
        id: `person${i}`,
        name: `Person ${i}`,
        gender: i % 2 === 0 ? 'M' : 'F' as const,
        isRoot: true // All are roots to avoid complex relationships
      }))
    }
    
    const currentData: FamilyTree = {
      version: 2,
      persons,
      marriages: [],
      children: [],
    }
    
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'new-person', name: 'New Person', gender: 'M', isRoot: true })
        ]
      }
    }
    
    const start = Date.now()
    const result = applyStagedValidation(currentData, operation, onWarnings)
    const end = Date.now()
    
    // Should complete quickly (less than 100ms for 100 persons)
    expect(end - start).toBeLessThan(100)
    expect(result.persons).toHaveLength(101)
    expect(result.persons.find(p => p.id === 'new-person')).toBeDefined()
    expect(onWarnings).toHaveBeenCalledWith(['Multiple root persons found'])
  })

  it('should handle operations that create cycles', () => {
    const currentData = testScenarios.simpleFamily()
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      // Create a cycle: child -> parent -> child
      return {
        ...data,
        children: [
          ...data.children,
          { childId: 'father', marriageId: 'marriage-1' } // Make father a child of his own marriage
        ]
      }
    }
    
    expect(() => applyStagedValidation(currentData, operation, onWarnings)).toThrow('Validation failed')
    expect(onWarnings).not.toHaveBeenCalled()
  })

  it('should handle operations that create invalid relationships', () => {
    const currentData = testScenarios.simpleFamily()
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      // Create invalid marriage between same gender
      return {
        ...data,
        marriages: [
          ...data.marriages,
          createMockMarriage({ 
            id: 'invalid-marriage', 
            husbandId: 'child1', 
            wifeId: 'child1' // Self-marriage (invalid)
          })
        ]
      }
    }
    
    expect(() => applyStagedValidation(currentData, operation, onWarnings)).toThrow('Validation failed')
    expect(onWarnings).not.toHaveBeenCalled()
  })

  it('should handle operations that create disconnected components', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      // Add disconnected persons
      return {
        ...data,
        persons: [
          ...data.persons,
          createMockPerson({ id: 'isolated1', name: 'Isolated 1', gender: 'M', isRoot: false }),
          createMockPerson({ id: 'isolated2', name: 'Isolated 2', gender: 'F', isRoot: false }),
        ]
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.persons).toHaveLength(3)
    expect(onWarnings).toHaveBeenCalledWith(['2 isolated person(s) not connected to family tree'])
  })

  it('should handle operations that modify existing relationships', () => {
    const currentData: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'active' }),
      ],
      children: [],
    }
    const onWarnings = vi.fn()
    
    const operation = (data: FamilyTree): FamilyTree => {
      // Change marriage status
      return {
        ...data,
        marriages: data.marriages.map(m => 
          m.id === 'marriage1' 
            ? { ...m, status: 'divorced' as const }
            : m
        )
      }
    }
    
    const result = applyStagedValidation(currentData, operation, onWarnings)
    
    expect(result.marriages[0].status).toBe('divorced')
    expect(onWarnings).toHaveBeenCalledWith(['Multiple root persons found'])
  })
})
