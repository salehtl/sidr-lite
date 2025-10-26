import type { FamilyTree, Person, Marriage, ChildLink, Gender } from './types/domain'
import { expect } from 'vitest'

// Factory functions for creating test data
export function createMockPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    name: 'John Doe',
    gender: 'M',
    isRoot: true,
    ...overrides,
  }
}

export function createMockMarriage(overrides: Partial<Marriage> = {}): Marriage {
  return {
    id: 'marriage-1',
    husbandId: 'husband-1',
    wifeId: 'wife-1',
    status: 'active',
    marriageDate: null,
    divorceDate: null,
    ...overrides,
  }
}

export function createMockChildLink(overrides: Partial<ChildLink> = {}): ChildLink {
  return {
    childId: 'child-1',
    marriageId: 'marriage-1',
    ...overrides,
  }
}

export function createMockFamilyTree(overrides: Partial<FamilyTree> = {}): FamilyTree {
  return {
    version: 2,
    persons: [],
    marriages: [],
    children: [],
    ...overrides,
  }
}

// Common test scenarios
export const testScenarios = {
  // Simple family: 2 parents, 2 children
  simpleFamily: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
      createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
      createMockPerson({ id: 'child2', name: 'Child 2', gender: 'F', isRoot: false }),
    ],
    marriages: [
      createMockMarriage({ id: 'marriage-1', husbandId: 'father', wifeId: 'mother' }),
    ],
    children: [
      createMockChildLink({ childId: 'child1', marriageId: 'marriage-1' }),
      createMockChildLink({ childId: 'child2', marriageId: 'marriage-1' }),
    ],
  }),

  // Polygamous family: 1 husband, 2 wives, children
  polygamousFamily: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
      createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
      createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
      createMockPerson({ id: 'child2', name: 'Child 2', gender: 'F', isRoot: false }),
    ],
    marriages: [
      createMockMarriage({ id: 'marriage-1', husbandId: 'husband', wifeId: 'wife1' }),
      createMockMarriage({ id: 'marriage-2', husbandId: 'husband', wifeId: 'wife2' }),
    ],
    children: [
      createMockChildLink({ childId: 'child1', marriageId: 'marriage-1' }),
      createMockChildLink({ childId: 'child2', marriageId: 'marriage-2' }),
    ],
  }),

  // Multi-generation family: grandparents → parents → children
  multiGenerationFamily: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'grandfather', name: 'Grandfather', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'grandmother', name: 'Grandmother', gender: 'F', isRoot: true }),
      createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: false }),
      createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: true }),
      createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
    ],
    marriages: [
      createMockMarriage({ id: 'marriage-1', husbandId: 'grandfather', wifeId: 'grandmother' }),
      createMockMarriage({ id: 'marriage-2', husbandId: 'father', wifeId: 'mother' }),
    ],
    children: [
      createMockChildLink({ childId: 'father', marriageId: 'marriage-1' }),
      createMockChildLink({ childId: 'child', marriageId: 'marriage-2' }),
    ],
  }),

  // Divorced/remarried scenario
  divorcedRemarried: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: false }),
      createMockPerson({ id: 'person3', name: 'Person 3', gender: 'F', isRoot: false }),
    ],
    marriages: [
      createMockMarriage({ 
        id: 'marriage-1', 
        husbandId: 'person1', 
        wifeId: 'person2', 
        status: 'divorced' 
      }),
      createMockMarriage({ 
        id: 'marriage-2', 
        husbandId: 'person1', 
        wifeId: 'person3', 
        status: 'active' 
      }),
    ],
    children: [],
  }),

  // Invalid scenario: ancestor-descendant marriage (should be prevented)
  invalidAncestorDescendant: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'grandfather', name: 'Grandfather', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'grandmother', name: 'Grandmother', gender: 'F', isRoot: false }),
      createMockPerson({ id: 'father', name: 'Father', gender: 'M', isRoot: false }),
      createMockPerson({ id: 'mother', name: 'Mother', gender: 'F', isRoot: false }),
      createMockPerson({ id: 'child', name: 'Child', gender: 'F', isRoot: false }),
    ],
    marriages: [
      createMockMarriage({ id: 'marriage-1', husbandId: 'grandfather', wifeId: 'grandmother' }),
      createMockMarriage({ id: 'marriage-2', husbandId: 'father', wifeId: 'mother' }),
      // This should be invalid: grandfather marrying granddaughter
      createMockMarriage({ id: 'marriage-3', husbandId: 'grandfather', wifeId: 'child' }),
    ],
    children: [
      createMockChildLink({ childId: 'father', marriageId: 'marriage-1' }),
      createMockChildLink({ childId: 'child', marriageId: 'marriage-2' }),
    ],
  }),

  // Invalid scenario: same-gender marriage (should be prevented)
  invalidSameGender: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
      createMockPerson({ id: 'person2', name: 'Person 2', gender: 'M', isRoot: false }),
    ],
    marriages: [
      // This should be invalid: two men marrying
      createMockMarriage({ id: 'marriage-1', husbandId: 'person1', wifeId: 'person2' }),
    ],
    children: [],
  }),

  // Empty tree
  emptyTree: (): FamilyTree => ({
    version: 2,
    persons: [],
    marriages: [],
    children: [],
  }),

  // Single person
  singlePerson: (): FamilyTree => ({
    version: 2,
    persons: [
      createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
    ],
    marriages: [],
    children: [],
  }),
}

// Helper functions for test assertions
export function expectValidationError(errors: any[], field: string, message: string) {
  const error = errors.find(e => e.field === field && e.message.includes(message))
  expect(error).toBeDefined()
  expect(error?.field).toBe(field)
  expect(error?.message).toContain(message)
}

export function expectNoValidationError(errors: any[], field: string, message: string) {
  const error = errors.find(e => e.field === field && e.message.includes(message))
  expect(error).toBeUndefined()
}

// Helper to create test data with specific IDs
export function createTestData(ids: {
  persons?: string[]
  marriages?: string[]
  children?: string[]
}) {
  const persons = (ids.persons || []).map((id, index) => 
    createMockPerson({ 
      id, 
      name: `Person ${id}`, 
      gender: index % 2 === 0 ? 'M' : 'F' as Gender,
      isRoot: index === 0 
    })
  )
  
  const marriages = (ids.marriages || []).map((id, index) => 
    createMockMarriage({ 
      id, 
      husbandId: persons[index * 2]?.id || `husband-${index}`,
      wifeId: persons[index * 2 + 1]?.id || `wife-${index}`
    })
  )
  
  const children = (ids.children || []).map((id, index) => 
    createMockChildLink({ 
      childId: id, 
      marriageId: marriages[index]?.id || `marriage-${index}` 
    })
  )
  
  return { persons, marriages, children }
}
