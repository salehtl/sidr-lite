import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFamilyTreeStore } from './familyTreeStore'
import { testScenarios } from '../test-utils'

// Mock storage utilities
vi.mock('../utils/storage', () => ({
  loadFromStorage: vi.fn(() => ({
    version: 2,
    persons: [],
    marriages: [],
    children: []
  })),
  saveToStorage: vi.fn()
}))

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(2))
  }
})

describe('FamilyTreeStore with v3 Validation', () => {
  let store: ReturnType<typeof useFamilyTreeStore.getState>

  beforeEach(() => {
    // Reset the store to initial state
    store = useFamilyTreeStore.getState()
    store.clearData()
  })

  // Helper function to get fresh store state
  const getStore = (): ReturnType<typeof useFamilyTreeStore.getState> => {
    return useFamilyTreeStore.getState()
  }

  describe('createPerson', () => {
    it('should create a person with validation', () => {
      store.createPerson('John Doe', 'M')
      
      // Get fresh store state for assertions
      const freshStore = getStore()
      expect(freshStore.data.persons).toHaveLength(1)
      expect(freshStore.data.persons[0].name).toBe('John Doe')
      expect(freshStore.data.persons[0].gender).toBe('M')
      expect(freshStore.data.persons[0].isRoot).toBe(true) // First person should be root
    })

    it('should reject invalid person data', () => {
      expect(() => {
        store.createPerson('A', 'M') // Name too short
      }).toThrow('Validation failed')
    })

    it('should reject invalid gender', () => {
      expect(() => {
        store.createPerson('John Doe', 'U' as any)
      }).toThrow('Validation failed')
    })

    it('should handle multiple persons correctly', () => {
      store.createPerson('John Doe', 'M')
      store.createPerson('Jane Doe', 'F')
      
      expect(store.data.persons).toHaveLength(2)
      expect(store.data.persons[0].isRoot).toBe(true)
      expect(store.data.persons[1].isRoot).toBe(true) // Both are roots initially
    })
  })

  describe('createMarriage', () => {
    beforeEach(() => {
      store.createPerson('John Doe', 'M')
      store.createPerson('Jane Doe', 'F')
    })

    it('should create a marriage with validation', () => {
      const marriageId = store.createMarriage(store.data.persons[0].id, store.data.persons[1].id)
      
      expect(marriageId).toBeDefined()
      expect(store.data.marriages).toHaveLength(1)
      expect(store.data.marriages[0].status).toBe('active')
    })

    it('should reject marriage between same person', () => {
      expect(() => {
        store.createMarriage(store.data.persons[0].id, store.data.persons[0].id)
      }).toThrow('Validation failed')
    })

    it('should reject marriage between persons of same gender', () => {
      store.createPerson('Bob Doe', 'M')
      
      expect(() => {
        store.createMarriage(store.data.persons[0].id, store.data.persons[2].id) // M-M marriage
      }).toThrow('Validation failed')
    })

    it('should enforce polygamy limits', () => {
      // Create multiple wives for one husband
      const husband = store.data.persons[0]
      const wives = []
      
      for (let i = 0; i < 4; i++) {
        const wifeId = store.createPerson(`Wife ${i}`, 'F')
        wives.push(wifeId)
        store.createMarriage(husband.id, wifeId)
      }
      
      // Try to add a 5th wife
      const wife5Id = store.createPerson('Wife 5', 'F')
      
      expect(() => {
        store.createMarriage(husband.id, wife5Id)
      }).toThrow('Validation failed')
    })

    it('should allow historical marriages to not count toward limits', () => {
      const husband = store.data.persons[0]
      const wife1 = store.data.persons[1]
      
      // Create and divorce first marriage
      const marriage1Id = store.createMarriage(husband.id, wife1.id)
      store.setMarriageStatus(marriage1Id, 'divorced')
      
      // Create second wife
      const wife2Id = store.createPerson('Wife 2', 'F')
      store.createMarriage(husband.id, wife2Id)
      
      expect(store.data.marriages).toHaveLength(2)
      expect(store.data.marriages[0].status).toBe('divorced')
      expect(store.data.marriages[1].status).toBe('active')
    })
  })

  describe('addChild', () => {
    beforeEach(() => {
      const husbandId = store.createPerson('John Doe', 'M')
      const wifeId = store.createPerson('Jane Doe', 'F')
      store.createMarriage(husbandId, wifeId)
    })

    it('should add a child to a marriage', () => {
      const marriage = store.data.marriages[0]
      const childId = store.addChild(marriage.id, 'Child Doe', 'M')
      
      expect(childId).toBeDefined()
      expect(store.data.children).toHaveLength(1)
      expect(store.data.children[0].childId).toBe(childId)
      expect(store.data.children[0].marriageId).toBe(marriage.id)
    })

    it('should reject invalid child data', () => {
      const marriage = store.data.marriages[0]
      
      expect(() => {
        store.addChild(marriage.id, 'A', 'M') // Name too short
      }).toThrow('Validation failed')
    })

    it('should update isRoot status after adding child', () => {
      const marriage = store.data.marriages[0]
      const childId = store.addChild(marriage.id, 'Child Doe', 'M')
      
      // Child should not be root (has parents)
      const child = store.data.persons.find(p => p.id === childId)
      expect(child?.isRoot).toBe(false)
    })
  })

  describe('setMarriageStatus', () => {
    beforeEach(() => {
      const husbandId = store.createPerson('John Doe', 'M')
      const wifeId = store.createPerson('Jane Doe', 'F')
      store.createMarriage(husbandId, wifeId)
    })

    it('should update marriage status', () => {
      const marriage = store.data.marriages[0]
      store.setMarriageStatus(marriage.id, 'divorced')
      
      expect(store.data.marriages[0].status).toBe('divorced')
    })

    it('should reject invalid status transitions', () => {
      const marriage = store.data.marriages[0]
      store.setMarriageStatus(marriage.id, 'divorced')
      
      expect(() => {
        store.setMarriageStatus(marriage.id, 'active') // Cannot reactivate divorced marriage
      }).toThrow('Cannot reactivate a divorced marriage')
    })
  })

  describe('deletePerson', () => {
    beforeEach(() => {
      const husbandId = store.createPerson('John Doe', 'M')
      const wifeId = store.createPerson('Jane Doe', 'F')
      const marriageId = store.createMarriage(husbandId, wifeId)
      store.addChild(marriageId, 'Child Doe', 'M')
    })

    it('should delete a person with force flags', () => {
      const person = store.data.persons[0]
      const result = store.deletePerson({
        personId: person.id,
        forceOrphan: true,
        forceRootDelete: true
      })
      
      expect(result.deletedPerson.id).toBe(person.id)
      expect(store.data.persons).toHaveLength(2) // Wife and child remain
    })

    it('should reject deletion without force flags when it would orphan children', () => {
      const person = store.data.persons[0] // Husband
      
      expect(() => {
        store.deletePerson({ personId: person.id })
      }).toThrow('Cannot delete person: would orphan')
    })

    it('should reject deletion of root person without force flag', () => {
      const person = store.data.persons[0] // Husband (root)
      
      expect(() => {
        store.deletePerson({ personId: person.id, forceOrphan: true })
      }).toThrow('Cannot delete root person without forceRootDelete flag')
    })

    it('should handle last person deletion', () => {
      // Clear all data first
      store.clearData()
      const personId = store.createPerson('John Doe', 'M')
      
      store.deletePerson({
        personId,
        forceRootDelete: true
      })
      
      expect(store.data.persons).toHaveLength(0)
      expect(store.data.marriages).toHaveLength(0)
      expect(store.data.children).toHaveLength(0)
    })
  })

  describe('updatePersonName', () => {
    beforeEach(() => {
      store.createPerson('John Doe', 'M')
    })

    it('should update person name', () => {
      const person = store.data.persons[0]
      store.updatePersonName(person.id, 'John Smith')
      
      expect(store.data.persons[0].name).toBe('John Smith')
    })

    it('should reject invalid name', () => {
      const person = store.data.persons[0]
      
      expect(() => {
        store.updatePersonName(person.id, 'A') // Too short
      }).toThrow('Validation failed')
    })
  })

  describe('updatePersonGender', () => {
    beforeEach(() => {
      store.createPerson('John Doe', 'M')
    })

    it('should update person gender', () => {
      const person = store.data.persons[0]
      store.updatePersonGender(person.id, 'F')
      
      expect(store.data.persons[0].gender).toBe('F')
    })

    it('should reject invalid gender', () => {
      const person = store.data.persons[0]
      
      expect(() => {
        store.updatePersonGender(person.id, 'U' as any)
      }).toThrow('Validation failed')
    })
  })

  describe('updateMarriageDates', () => {
    beforeEach(() => {
      const husbandId = store.createPerson('John Doe', 'M')
      const wifeId = store.createPerson('Jane Doe', 'F')
      store.createMarriage(husbandId, wifeId)
    })

    it('should update marriage dates', () => {
      const marriage = store.data.marriages[0]
      store.updateMarriageDates(marriage.id, '2020-01-01', null)
      
      expect(store.data.marriages[0].marriageDate).toBe('2020-01-01')
    })
  })

  describe('loadData', () => {
    it('should load and validate data', () => {
      const data = testScenarios.simpleFamily()
      store.loadData(data)
      
      // Get fresh store state for assertions
      const freshStore = getStore()
      expect(freshStore.data.persons).toHaveLength(data.persons.length)
      expect(freshStore.data.marriages).toHaveLength(data.marriages.length)
      expect(freshStore.data.children).toHaveLength(data.children.length)
    })

    it('should reject invalid data', () => {
      const invalidData = {
        ...testScenarios.simpleFamily(),
        persons: [
          ...testScenarios.simpleFamily().persons,
          {
            id: 'invalid-person',
            name: 'A', // Too short
            gender: 'U' as any, // Invalid gender
            isRoot: true
          }
        ]
      }
      
      expect(() => {
        store.loadData(invalidData)
      }).toThrow('Validation failed')
    })
  })

  describe('Warning Handling', () => {
    it('should handle multiple root persons warning', () => {
      // Create multiple root persons
      store.createPerson('Person 1', 'M')
      store.createPerson('Person 2', 'F')
      store.createPerson('Person 3', 'M')
      
      // The store should handle this gracefully (warnings are logged)
      expect(store.data.persons).toHaveLength(3)
      expect(store.data.persons.every(p => p.isRoot)).toBe(true)
    })

    it('should handle isolated persons warning', () => {
      // Create a person with no relationships
      store.createPerson('Isolated Person', 'M')
      
      // The store should handle this gracefully
      expect(store.data.persons).toHaveLength(1)
    })
  })

  describe('Complex Family Scenarios', () => {
    it('should handle multi-generation family', () => {
      // Create grandparents
      const grandpaId = store.createPerson('Grandpa', 'M')
      const grandmaId = store.createPerson('Grandma', 'F')
      const grandMarriageId = store.createMarriage(grandpaId, grandmaId)
      
      // Create parents
      const dadId = store.addChild(grandMarriageId, 'Dad', 'M')
      const momId = store.createPerson('Mom', 'F')
      const parentMarriageId = store.createMarriage(dadId, momId)
      
      // Create children
      store.addChild(parentMarriageId, 'Child 1', 'M')
      store.addChild(parentMarriageId, 'Child 2', 'F')
      
      expect(store.data.persons).toHaveLength(6)
      expect(store.data.marriages).toHaveLength(2)
      expect(store.data.children).toHaveLength(3)
    })

    it('should handle polygamous family', () => {
      const husbandId = store.createPerson('Husband', 'M')
      
      // Create multiple wives
      const wife1Id = store.createPerson('Wife 1', 'F')
      const wife2Id = store.createPerson('Wife 2', 'F')
      const wife3Id = store.createPerson('Wife 3', 'F')
      
      const marriage1Id = store.createMarriage(husbandId, wife1Id)
      store.createMarriage(husbandId, wife2Id)
      const marriage3Id = store.createMarriage(husbandId, wife3Id)
      
      expect(store.data.marriages).toHaveLength(3)
      expect(store.data.marriages.every(m => m.husbandId === husbandId)).toBe(true)
    })

    it('should handle divorced and remarried family', () => {
      const person1Id = store.createPerson('Person 1', 'M')
      const person2Id = store.createPerson('Person 2', 'F')
      
      // First marriage
      const marriage1Id = store.createMarriage(person1Id, person2Id)
      store.setMarriageStatus(marriage1Id, 'divorced')
      
      // Second marriage
      const person3Id = store.createPerson('Person 3', 'F')
      store.createMarriage(person1Id, person3Id)
      
      expect(store.data.marriages).toHaveLength(2)
      expect(store.data.marriages[0].status).toBe('divorced')
      expect(store.data.marriages[1].status).toBe('active')
    })
  })

  describe('Error Recovery', () => {
    it('should maintain data integrity after failed operations', () => {
      const initialPersonCount = store.data.persons.length
      
      // Try to create invalid person
      expect(() => {
        store.createPerson('A', 'M') // Too short
      }).toThrow('Validation failed')
      
      // Data should remain unchanged
      expect(store.data.persons).toHaveLength(initialPersonCount)
    })

    it('should handle partial operation failures', () => {
      const personId = store.createPerson('John Doe', 'M')
      
      // Try to create invalid marriage
      expect(() => {
        store.createMarriage(personId, personId) // Self-marriage
      }).toThrow('Validation failed')
      
      // Person should still exist
      expect(store.data.persons).toHaveLength(1)
      expect(store.data.marriages).toHaveLength(0)
    })
  })

  describe('addSibling', () => {
    beforeEach(() => {
      // Create a family with parents and one child
      const fatherId = store.createPerson('John Doe', 'M')
      const motherId = store.createPerson('Jane Doe', 'F')
      const marriageId = store.createMarriage(fatherId, motherId)
      const childId = store.addChild(marriageId, 'Child Doe', 'M')
    })

    it('should add a sibling to existing parents', () => {
      const child = store.data.persons.find(p => p.name === 'Child Doe')
      expect(child).toBeDefined()
      
      const siblingId = store.addSibling(child!.id, 'Sibling Doe', 'F')
      
      expect(siblingId).toBeDefined()
      expect(store.data.persons).toHaveLength(4) // Father, Mother, Child, Sibling
      
      // Check that sibling is linked to the same marriage
      const childLinks = store.data.children.filter(c => c.marriageId === store.data.marriages[0].id)
      expect(childLinks).toHaveLength(2) // Original child + new sibling
    })

    it('should throw error if person has no parents', () => {
      const orphanId = store.createPerson('Orphan', 'M')
      
      expect(() => {
        store.addSibling(orphanId, 'Sibling', 'F')
      }).toThrow('Cannot add sibling: person has no parents')
    })

    it('should throw error if person not found', () => {
      expect(() => {
        store.addSibling('non-existent', 'Sibling', 'F')
      }).toThrow('Person not found')
    })
  })

  describe('addParent', () => {
    it('should add first parent to orphaned child', () => {
      const childId = store.createPerson('Orphan Child', 'M')
      
      const parentId = store.addParent(childId, 'Parent', 'M')
      
      expect(parentId).toBeDefined()
      expect(store.data.persons).toHaveLength(2)
      
      // Check that child is linked to the new parent's marriage
      const childLink = store.data.children.find(c => c.childId === childId)
      expect(childLink).toBeDefined()
      
      const marriage = store.data.marriages.find(m => m.id === childLink!.marriageId)
      expect(marriage).toBeDefined()
      expect(marriage!.husbandId).toBe(parentId) // Male parent
      expect(marriage!.wifeId).toBeNull() // Incomplete marriage
    })

    it('should complete existing incomplete marriage when adding second parent', () => {
      // Create child with one parent
      const childId = store.createPerson('Child', 'M')
      const firstParentId = store.addParent(childId, 'First Parent', 'M')
      
      // Add second parent
      const secondParentId = store.addParent(childId, 'Second Parent', 'F')
      
      expect(secondParentId).toBeDefined()
      expect(store.data.persons).toHaveLength(3)
      
      // Check that marriage is now complete
      const childLink = store.data.children.find(c => c.childId === childId)
      const marriage = store.data.marriages.find(m => m.id === childLink!.marriageId)
      
      expect(marriage!.husbandId).toBe(firstParentId)
      expect(marriage!.wifeId).toBe(secondParentId)
    })

    it('should throw error if child not found', () => {
      expect(() => {
        store.addParent('non-existent', 'Parent', 'M')
      }).toThrow('Child not found')
    })

    it('should throw error if child already has two parents', () => {
      // Create child with two parents
      const childId = store.createPerson('Child', 'M')
      store.addParent(childId, 'First Parent', 'M')
      store.addParent(childId, 'Second Parent', 'F')
      
      // Try to add third parent
      expect(() => {
        store.addParent(childId, 'Third Parent', 'M')
      }).toThrow('Child already has two parents')
    })
  })

  describe('completeParentMarriage', () => {
    beforeEach(() => {
      // Create incomplete marriage
      const parentId = store.createPerson('Parent', 'M')
      const childId = store.createPerson('Child', 'M')
      const marriageId = store.createMarriage(parentId, null)
      
      // Link child to marriage
      store.data.children.push({
        childId,
        marriageId
      })
    })

    it('should complete incomplete marriage with second parent', () => {
      const secondParentId = store.createPerson('Second Parent', 'F')
      const marriage = store.data.marriages[0]
      
      store.completeParentMarriage(marriage.id, secondParentId)
      
      // Check that marriage is now complete
      const updatedMarriage = store.data.marriages.find(m => m.id === marriage.id)
      expect(updatedMarriage!.husbandId).toBe(store.data.persons[0].id) // First parent
      expect(updatedMarriage!.wifeId).toBe(secondParentId) // Second parent
    })

    it('should throw error if marriage not found', () => {
      const secondParentId = store.createPerson('Second Parent', 'F')
      
      expect(() => {
        store.completeParentMarriage('non-existent', secondParentId)
      }).toThrow('Marriage not found')
    })

    it('should throw error if marriage is already complete', () => {
      // Create complete marriage
      const husbandId = store.createPerson('Husband', 'M')
      const wifeId = store.createPerson('Wife', 'F')
      const marriageId = store.createMarriage(husbandId, wifeId)
      
      const thirdPersonId = store.createPerson('Third Person', 'M')
      
      expect(() => {
        store.completeParentMarriage(marriageId, thirdPersonId)
      }).toThrow('Marriage is already complete')
    })

    it('should throw error if second parent not found', () => {
      const marriage = store.data.marriages[0]
      
      expect(() => {
        store.completeParentMarriage(marriage.id, 'non-existent')
      }).toThrow('Second parent not found')
    })

    it('should throw error for gender mismatch', () => {
      const secondParentId = store.createPerson('Second Parent', 'M') // Same gender as first parent
      const marriage = store.data.marriages[0]
      
      expect(() => {
        store.completeParentMarriage(marriage.id, secondParentId)
      }).toThrow('Gender mismatch for marriage completion')
    })
  })

  describe('Integration Tests - Complete Family Creation Workflows', () => {
    it('should create root → add spouse → add child → add sibling (full flow)', () => {
      // Create root person
      const rootId = store.createPerson('Root Person', 'M')
      expect(store.data.persons).toHaveLength(1)
      expect(store.data.persons[0].isRoot).toBe(true)

      // Add spouse
      const spouseId = store.createPerson('Spouse', 'F')
      const marriageId = store.createMarriage(rootId, spouseId)
      expect(store.data.marriages).toHaveLength(1)
      expect(store.data.marriages[0].husbandId).toBe(rootId)
      expect(store.data.marriages[0].wifeId).toBe(spouseId)

      // Add child
      const childId = store.addChild(marriageId, 'Child', 'M')
      expect(store.data.children).toHaveLength(1)
      expect(store.data.children[0].childId).toBe(childId)
      expect(store.data.children[0].marriageId).toBe(marriageId)

      // Add sibling
      const siblingId = store.addSibling(childId, 'Sibling', 'F')
      expect(store.data.children).toHaveLength(2)
      
      // Verify both children are linked to the same marriage
      const childLinks = store.data.children.filter(c => c.marriageId === marriageId)
      expect(childLinks).toHaveLength(2)
      
      // Verify no duplicate persons were created
      expect(store.data.persons).toHaveLength(4) // Root, Spouse, Child, Sibling
    })

    it('should create orphaned person → add first parent → add second parent', () => {
      // Create orphaned person
      const orphanId = store.createPerson('Orphan', 'M')
      expect(store.data.persons).toHaveLength(1)
      expect(store.data.children).toHaveLength(0)

      // Add first parent
      const firstParentId = store.addParent(orphanId, 'First Parent', 'M')
      expect(store.data.persons).toHaveLength(2)
      expect(store.data.children).toHaveLength(1)
      expect(store.data.marriages).toHaveLength(1)
      
      // Check incomplete marriage
      const marriage = store.data.marriages[0]
      expect(marriage.husbandId).toBe(firstParentId)
      expect(marriage.wifeId).toBeNull()

      // Add second parent
      const secondParentId = store.addParent(orphanId, 'Second Parent', 'F')
      expect(store.data.persons).toHaveLength(3)
      expect(store.data.children).toHaveLength(1) // Still only one child
      expect(store.data.marriages).toHaveLength(1) // Still only one marriage
      
      // Check complete marriage
      const updatedMarriage = store.data.marriages[0]
      expect(updatedMarriage.husbandId).toBe(firstParentId)
      expect(updatedMarriage.wifeId).toBe(secondParentId)
    })

    it('should handle complex multi-generation family creation', () => {
      // Create grandparents
      const grandpaId = store.createPerson('Grandpa', 'M')
      const grandmaId = store.createPerson('Grandma', 'F')
      const grandparentMarriageId = store.createMarriage(grandpaId, grandmaId)

      // Create parents
      const fatherId = store.addChild(grandparentMarriageId, 'Father', 'M')
      const motherId = store.createPerson('Mother', 'F')
      const parentMarriageId = store.createMarriage(fatherId, motherId)

      // Create children
      const child1Id = store.addChild(parentMarriageId, 'Child 1', 'M')
      const child2Id = store.addSibling(child1Id, 'Child 2', 'F')

      // Verify family structure
      expect(store.data.persons).toHaveLength(6) // Grandpa, Grandma, Father, Mother, Child 1, Child 2
      expect(store.data.marriages).toHaveLength(2) // Grandparent marriage, Parent marriage
      expect(store.data.children).toHaveLength(3) // Father, Child 1, Child 2

      // Verify relationships
      const grandparentMarriage = store.data.marriages.find(m => m.id === grandparentMarriageId)
      const parentMarriage = store.data.marriages.find(m => m.id === parentMarriageId)
      
      expect(grandparentMarriage!.husbandId).toBe(grandpaId)
      expect(grandparentMarriage!.wifeId).toBe(grandmaId)
      expect(parentMarriage!.husbandId).toBe(fatherId)
      expect(parentMarriage!.wifeId).toBe(motherId)

      // Verify children are linked to correct marriages
      const fatherLink = store.data.children.find(c => c.childId === fatherId)
      const child1Link = store.data.children.find(c => c.childId === child1Id)
      const child2Link = store.data.children.find(c => c.childId === child2Id)
      
      expect(fatherLink!.marriageId).toBe(grandparentMarriageId)
      expect(child1Link!.marriageId).toBe(parentMarriageId)
      expect(child2Link!.marriageId).toBe(parentMarriageId)
    })

    it('should handle edge cases: gender mismatches, duplicate operations', () => {
      // Create family
      const fatherId = store.createPerson('Father', 'M')
      const motherId = store.createPerson('Mother', 'F')
      const marriageId = store.createMarriage(fatherId, motherId)
      const childId = store.addChild(marriageId, 'Child', 'M')

      // Try to add sibling with same gender as existing child (should work)
      const siblingId = store.addSibling(childId, 'Sibling', 'M')
      expect(siblingId).toBeDefined()

      // Try to add parent to child who already has two parents (should fail)
      expect(() => {
        store.addParent(childId, 'Third Parent', 'M')
      }).toThrow('Child already has two parents')

      // Try to complete already complete marriage (should fail)
      expect(() => {
        store.completeParentMarriage(marriageId, 'some-id')
      }).toThrow('Marriage is already complete')
    })
  })
})
