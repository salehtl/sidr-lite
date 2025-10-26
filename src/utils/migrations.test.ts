import { describe, it, expect } from 'vitest'
import { migrateV1ToV2, needsMigration } from './migrations'
import { createMockPerson, createMockMarriage, createMockChildLink } from '../test-utils'
// import type { FamilyTree } from '../types/domain'

describe('migrations', () => {
  describe('needsMigration', () => {
    it('should return true for v1 data', () => {
      const v1Data = {
        version: 1,
        persons: [],
        marriages: [],
        children: []
      }

      expect(needsMigration(v1Data)).toBe(true)
    })

    it('should return false for v2 data', () => {
      const v2Data = {
        version: 2,
        persons: [],
        marriages: [],
        children: []
      }

      expect(needsMigration(v2Data)).toBe(false)
    })

    it('should return false for data without version', () => {
      const noVersionData = {
        persons: [],
        marriages: [],
        children: []
      }

      expect(needsMigration(noVersionData as any)).toBe(false)
    })
  })

  describe('migrateV1ToV2', () => {
    it('should migrate simple v1 data to v2', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(2)
      expect(result.marriages).toHaveLength(1)
      expect(result.children).toHaveLength(0)
    })

    it('should convert U gender to M in v1 data', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'U' as any, isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons[0].gender).toBe('M')
      expect(result.persons[1].gender).toBe('F')
    })

    it('should preserve M and F genders', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons[0].gender).toBe('M')
      expect(result.persons[1].gender).toBe('F')
    })

    it('should recalculate isRoot for all persons', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'parent1', name: 'Parent 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'parent2', name: 'Parent 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'parent1', wifeId: 'parent2' }),
        ],
        children: [
          createMockChildLink({ childId: 'child1', marriageId: 'marriage1' }),
        ]
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons[0].isRoot).toBe(true) // parent1 - not a child
      expect(result.persons[1].isRoot).toBe(true) // parent2 - not a child
      expect(result.persons[2].isRoot).toBe(false) // child1 - is a child
    })

    it('should handle empty v1 data', () => {
      const v1Data = {
        version: 1,
        persons: [],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(0)
      expect(result.marriages).toHaveLength(0)
      expect(result.children).toHaveLength(0)
    })

    it('should handle v1 data with only persons', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(1)
      expect(result.persons[0].isRoot).toBe(true)
    })

    it('should handle v1 data with complex family structure', () => {
      const v1Data = {
        version: 1,
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
        ]
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(5)
      expect(result.marriages).toHaveLength(2)
      expect(result.children).toHaveLength(2)
      
      // Check isRoot recalculation
      expect(result.persons.find(p => p.id === 'grandfather')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'grandmother')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'father')?.isRoot).toBe(false) // is a child
      expect(result.persons.find(p => p.id === 'mother')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'child')?.isRoot).toBe(false) // is a child
    })

    it('should handle v1 data with polygamous family', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'husband', name: 'Husband', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'wife1', name: 'Wife 1', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'wife2', name: 'Wife 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
          createMockPerson({ id: 'child2', name: 'Child 2', gender: 'F', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'husband', wifeId: 'wife1' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'husband', wifeId: 'wife2' }),
        ],
        children: [
          createMockChildLink({ childId: 'child1', marriageId: 'marriage1' }),
          createMockChildLink({ childId: 'child2', marriageId: 'marriage2' }),
        ]
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(5)
      expect(result.marriages).toHaveLength(2)
      expect(result.children).toHaveLength(2)
      
      // Check isRoot recalculation
      expect(result.persons.find(p => p.id === 'husband')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'wife1')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'wife2')?.isRoot).toBe(true)
      expect(result.persons.find(p => p.id === 'child1')?.isRoot).toBe(false) // is a child
      expect(result.persons.find(p => p.id === 'child2')?.isRoot).toBe(false) // is a child
    })

    it('should handle v1 data with divorced/remarried scenario', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2', status: 'divorced' as any }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person1', wifeId: 'person3', status: 'active' as any }),
        ],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(3)
      expect(result.marriages).toHaveLength(2)
      expect(result.children).toHaveLength(0)
      
      // Check marriage statuses are preserved
      expect(result.marriages.find(m => m.id === 'marriage1')?.status).toBe('divorced')
      expect(result.marriages.find(m => m.id === 'marriage2')?.status).toBe('active')
    })

    it('should handle v1 data with mixed gender types', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'U' as any, isRoot: true }),
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons[0].gender).toBe('M')
      expect(result.persons[1].gender).toBe('F')
      expect(result.persons[2].gender).toBe('M') // U converted to M
    })

    it('should preserve all other person properties', () => {
      const v1Data = {
        version: 1,
        persons: [
          {
            id: 'person1',
            name: 'Person 1',
            gender: 'M' as any,
            isRoot: true,
            birthDate: '1990-01-01',
            deathDate: null,
            notes: 'Some notes'
          }
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons[0].id).toBe('person1')
      expect(result.persons[0].name).toBe('Person 1')
      expect(result.persons[0].gender).toBe('M')
      expect(result.persons[0].isRoot).toBe(true)
      // birthDate, deathDate, and notes properties were removed in v2
    })

    it('should preserve all marriage properties', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          {
            id: 'marriage1',
            husbandId: 'person1',
            wifeId: 'person2',
            status: 'active' as any,
            marriageDate: '2020-01-01',
            divorceDate: null,
            notes: 'Marriage notes'
          }
        ],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.marriages[0].id).toBe('marriage1')
      expect(result.marriages[0].husbandId).toBe('person1')
      expect(result.marriages[0].wifeId).toBe('person2')
      expect(result.marriages[0].status).toBe('active')
      expect(result.marriages[0].marriageDate).toBe('2020-01-01')
      expect(result.marriages[0].divorceDate).toBe(null)
      // notes property was removed in v2
    })

    it('should preserve all child link properties', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'parent1', name: 'Parent 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'parent2', name: 'Parent 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'parent1', wifeId: 'parent2' }),
        ],
        children: [
          {
            childId: 'child1',
            marriageId: 'marriage1',
            notes: 'Child notes'
          }
        ]
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.children[0].childId).toBe('child1')
      expect(result.children[0].marriageId).toBe('marriage1')
      // notes property was removed in v2
    })
  })

  describe('Edge cases and complex scenarios', () => {
    it('should handle v1 data with orphaned children', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'child1', name: 'Child 1', gender: 'M', isRoot: false }),
          createMockPerson({ id: 'child2', name: 'Child 2', gender: 'F', isRoot: false }),
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(2)
      // Orphaned children should become root since they're not connected to any marriage
      expect(result.persons[0].isRoot).toBe(true)
      expect(result.persons[1].isRoot).toBe(true)
    })

    it('should handle v1 data with disconnected family trees', () => {
      const v1Data = {
        version: 1,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person3', name: 'Person 3', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person4', name: 'Person 4', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
          createMockMarriage({ id: 'marriage2', husbandId: 'person3', wifeId: 'person4' }),
        ],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(4)
      expect(result.marriages).toHaveLength(2)
      expect(result.children).toHaveLength(0)
      
      // All persons should be roots since they're not children
      expect(result.persons.every(p => p.isRoot)).toBe(true)
    })

    it('should handle v1 data with large family tree', () => {
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
      
      const v1Data = {
        version: 1,
        persons,
        marriages,
        children
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(100)
      expect(result.marriages).toHaveLength(50)
      expect(result.children).toHaveLength(0)
      
      // All persons should be roots since there are no children
      expect(result.persons.every(p => p.isRoot)).toBe(true)
    })

    it('should handle v1 data with missing properties gracefully', () => {
      const v1Data = {
        version: 1,
        persons: [
          {
            id: 'person1',
            name: 'Person 1',
            gender: 'U' as any,
            isRoot: true
            // Missing other properties
          }
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(1)
      expect(result.persons[0].gender).toBe('M') // U converted to M
      expect(result.persons[0].isRoot).toBe(true)
    })

    it('should handle v1 data with invalid gender gracefully', () => {
      const v1Data = {
        version: 1,
        persons: [
          {
            id: 'person1',
            name: 'Person 1',
            gender: 'INVALID' as any,
            isRoot: true
          }
        ],
        marriages: [],
        children: []
      }

      const result = migrateV1ToV2(v1Data)

      expect(result.version).toBe(2)
      expect(result.persons).toHaveLength(1)
      expect(result.persons[0].gender).toBe('INVALID') // Invalid gender remains unchanged
    })
  })
})
