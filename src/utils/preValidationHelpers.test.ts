import { describe, it, expect } from 'vitest'
import {
  preValidatePersonCreation,
  preValidateMarriageCreation
} from './preValidationHelpers'
import type { PreValidationResult } from './preValidationHelpers'
import { testScenarios, createMockPerson, createMockMarriage } from '../test-utils'
import type { FamilyTree, Gender } from '../types/domain'

describe('preValidatePersonCreation', () => {
  it('should validate correct person creation', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('John Doe', 'M', null, null, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should require name', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('', 'M', null, null, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Name is required')
  })

  it('should require name with at least 2 characters', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('A', 'M', null, null, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Name must be at least 2 characters long')
  })

  it('should validate spouse creation with correct gender', () => {
    const data = testScenarios.simpleFamily()
    const targetPerson = data.persons[0] // Father (M)
    const result = preValidatePersonCreation('Jane Doe', 'F', 'spouse', targetPerson.id, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject spouse creation with same gender', () => {
    const data = testScenarios.simpleFamily()
    const targetPerson = data.persons[0] // Father (M)
    const result = preValidatePersonCreation('John Doe', 'M', 'spouse', targetPerson.id, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Cannot marry')
  })

  it('should reject spouse creation with non-existent target', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('Jane Doe', 'F', 'spouse', 'non-existent', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Selected person not found')
  })

  it('should reject spouse creation when target has maximum marriages (husband)', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife3', name: 'Wife 3', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife4', name: 'Wife 4', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1', status: 'active' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'husband', wifeId: 'wife2', status: 'active' }),
        createMockMarriage({ id: 'marriage3', husbandId: 'husband', wifeId: 'wife3', status: 'active' }),
        createMockMarriage({ id: 'marriage4', husbandId: 'husband', wifeId: 'wife4', status: 'active' }),
      ],
      children: [],
    }
    
    const result = preValidatePersonCreation('Wife 5', 'F', 'spouse', 'husband', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Husband already has 4 active marriages (maximum allowed)')
  })

  it('should reject spouse creation when target has active marriage (wife)', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife', name: 'Wife', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife', status: 'active' }),
      ],
      children: [],
    }
    
    const result = preValidatePersonCreation('Husband 2', 'M', 'spouse', 'wife', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Wife already has an active marriage (maximum 1 allowed)')
  })

  it('should validate child creation', () => {
    const data = testScenarios.simpleFamily()
    const marriage = data.marriages[0]
    const result = preValidatePersonCreation('Child', 'M', 'child', marriage.id, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject child creation with non-existent marriage', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('Child', 'M', 'child', 'non-existent', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Selected marriage not found')
  })

  it('should validate parent creation', () => {
    const data = testScenarios.simpleFamily()
    const child = data.persons[2] // child1
    const result = preValidatePersonCreation('Parent', 'M', 'parent', child.id, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject parent creation when child already has 2 parents', () => {
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
        { childId: 'child', marriageId: 'marriage1' },
        { childId: 'child', marriageId: 'marriage2' },
      ],
    }
    
    const result = preValidatePersonCreation('Parent 3', 'M', 'parent', 'child', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Child already has both parents')
  })

  it('should validate sibling creation', () => {
    const data = testScenarios.simpleFamily()
    const sibling = data.persons[2] // child1
    const result = preValidatePersonCreation('Sibling', 'M', 'sibling', sibling.id, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject sibling creation when person has no parents', () => {
    const data = testScenarios.simpleFamily()
    const rootPerson = data.persons[0] // father (root)
    const result = preValidatePersonCreation('Sibling', 'M', 'sibling', rootPerson.id, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Father has no parents, so cannot add siblings')
  })

  it('should reject sibling creation with non-existent person', () => {
    const data = testScenarios.simpleFamily()
    const result = preValidatePersonCreation('Sibling', 'M', 'sibling', 'non-existent', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Selected person not found')
  })
})

describe('preValidateMarriageCreation', () => {
  it('should validate correct marriage creation', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    
    const result = preValidateMarriageCreation('person1', 'person2', data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject marriage with non-existent first person', () => {
    const data = testScenarios.simpleFamily()
    const person2 = data.persons[1]
    const result = preValidateMarriageCreation('non-existent', person2.id, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('First person not found')
  })

  it('should reject marriage with non-existent second person', () => {
    const data = testScenarios.simpleFamily()
    const person1 = data.persons[0]
    const result = preValidateMarriageCreation(person1.id, 'non-existent', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Second person not found')
  })

  it('should reject self-marriage', () => {
    const data = testScenarios.simpleFamily()
    const person = data.persons[0]
    const result = preValidateMarriageCreation(person.id, person.id, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Cannot marry a person to themselves')
  })

  it('should reject marriage with same gender', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'M', isRoot: true }),
      ],
      marriages: [],
      children: [],
    }
    
    const result = preValidateMarriageCreation('person1', 'person2', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Cannot create marriage between two men')
  })

  it('should reject duplicate active marriage', () => {
    const data = testScenarios.simpleFamily()
    const person1 = data.persons[0] // father
    const person2 = data.persons[1] // mother
    const result = preValidateMarriageCreation(person1.id, person2.id, data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Active marriage already exists between these persons')
  })

  it('should allow marriage after divorce', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'divorced' }),
      ],
      children: [],
    }
    
    const result = preValidateMarriageCreation('person1', 'person2', data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject ancestor-descendant marriage', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'grandfather', name: 'Grandfather', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'grandmother', name: 'Grandmother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: false }),
        createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'child', name: 'Child', gender: 'F', isRoot: false }), // Changed to F
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'grandfather', wifeId: 'grandmother' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'father', wifeId: 'mother' }),
      ],
      children: [
        { childId: 'father', marriageId: 'marriage1' },
        { childId: 'child', marriageId: 'marriage2' },
      ],
    }
    
    const result = preValidateMarriageCreation('grandfather', 'child', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('Cannot marry direct ancestor or descendant')
  })

  it('should reject marriage when husband has maximum marriages', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife3', name: 'Wife 3', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife4', name: 'Wife 4', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife5', name: 'Wife 5', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1', status: 'active' }),
        createMockMarriage({ id: 'marriage2', husbandId: 'husband', wifeId: 'wife2', status: 'active' }),
        createMockMarriage({ id: 'marriage3', husbandId: 'husband', wifeId: 'wife3', status: 'active' }),
        createMockMarriage({ id: 'marriage4', husbandId: 'husband', wifeId: 'wife4', status: 'active' }),
      ],
      children: [],
    }
    
    const result = preValidateMarriageCreation('husband', 'wife5', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Husband already has 4 active marriages (maximum allowed)')
  })

  it('should reject marriage when wife has active marriage', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband1', name: 'Husband 1', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'husband2', name: 'Husband 2', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife', name: 'Wife', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband1', wifeId: 'wife', status: 'active' }),
      ],
      children: [],
    }
    
    const result = preValidateMarriageCreation('husband2', 'wife', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Wife already has an active marriage (maximum 1 allowed)')
  })

  it('should handle polygamous marriage correctly', () => {
    const data: FamilyTree = {
      version: 2,
      persons: [
        createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
        createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
        createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
      ],
      marriages: [
        createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1', status: 'active' }),
      ],
      children: [],
    }
    
    const result = preValidateMarriageCreation('husband', 'wife2', data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('Edge cases and complex scenarios', () => {
  it('should handle empty tree for person creation', () => {
    const data = testScenarios.emptyTree()
    const result = preValidatePersonCreation('John Doe', 'M', null, null, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should handle empty tree for marriage creation', () => {
    const data = testScenarios.emptyTree()
    const result = preValidateMarriageCreation('person1', 'person2', data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('First person not found')
  })

  it('should handle single person tree', () => {
    const data = testScenarios.singlePerson()
    const result = preValidatePersonCreation('John Doe', 'M', null, null, data)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should handle complex family relationships', () => {
    const data = testScenarios.multiGenerationFamily()
    
    // Test adding a spouse to grandfather
    const grandfather = data.persons[0]
    const result1 = preValidatePersonCreation('New Wife', 'F', 'spouse', grandfather.id, data)
    expect(result1.isValid).toBe(true)
    
    // Test adding a child to existing marriage
    const marriage = data.marriages[1] // father-mother marriage
    const result2 = preValidatePersonCreation('New Child', 'M', 'child', marriage.id, data)
    expect(result2.isValid).toBe(true)
    
    // Test adding a parent to existing child
    const child = data.persons[4]
    const result3 = preValidatePersonCreation('New Parent', 'M', 'parent', child.id, data)
    expect(result3.isValid).toBe(true) // Child can have more parents added
  })

  it('should handle performance with large family trees', () => {
    // Create a large family tree
    const persons = []
    const marriages = []
    
    for (let i = 0; i < 1000; i++) {
      persons.push(createMockPerson({ 
        id: `person${i}`,
        name: `Person ${i}`,
        gender: i % 2 === 0 ? 'M' : 'F' as Gender,
        isRoot: true
      }))
    }
    
    const data: FamilyTree = {
      version: 2,
      persons,
      marriages,
      children: [],
    }
    
    const start = Date.now()
    const result = preValidatePersonCreation('New Person', 'M', null, null, data)
    const end = Date.now()
    
    // Should complete quickly (less than 100ms for 1000 persons)
    expect(end - start).toBeLessThan(100)
    expect(result.isValid).toBe(true)
  })
})
