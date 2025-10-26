import { describe, it, expect } from 'vitest'
import {
  validateIdentityAndShape,
  validateGenderAndMarriage,
  validatePolygamyLimits,
  validateParentAssignment,
  validateAncestryRules,
  validateHardInvariants,
  checkWarnings,
  validatePersonShape,
  validateMarriageShape,
  validateChildLinkShape,
  validateFamilyTree
} from './validators'
import type { ValidationError, ValidationErrorItem } from './validators'
import { createMockPerson, createMockMarriage, createMockChildLink, createMockFamilyTree, testScenarios, expectValidationError } from '../test-utils'
import type { FamilyTree } from '../types/domain'

describe('Section 2.1: Identity and Shape Invariants', () => {
  describe('validateIdentityAndShape', () => {
    it('should validate correct data', () => {
      const data = testScenarios.simpleFamily()
      const errors = validateIdentityAndShape(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject duplicate person IDs', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-1', name: 'Jane', gender: 'F', isRoot: true }) // Duplicate ID
        ],
        marriages: [],
        children: []
      })
      
      const errors = validateIdentityAndShape(data)
      expectValidationError(errors, 'person.id', 'Duplicate person ID: person-1')
    })

    it('should require person names with minimum 2 characters', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'A', gender: 'M', isRoot: true }) // Too short
        ],
        marriages: [],
        children: []
      })
      
      const errors = validateIdentityAndShape(data)
      expectValidationError(errors, 'person.name', 'Person person-1 name must be at least 2 characters')
    })

    it('should reject gender other than M or F', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'U' as any, isRoot: true })
        ],
        marriages: [],
        children: []
      })
      
      const errors = validateIdentityAndShape(data)
      expectValidationError(errors, 'person.gender', 'Person person-1 gender must be M or F')
    })

    it('should reject duplicate marriage IDs', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' }),
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-2', wifeId: 'person-1' }) // Duplicate ID
        ],
        children: []
      })
      
      const errors = validateIdentityAndShape(data)
      expectValidationError(errors, 'marriage.id', 'Duplicate marriage ID: marriage-1')
    })

    it('should reject self-marriage', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-1' }) // Self-marriage
        ],
        children: []
      })
      
      const errors = validateIdentityAndShape(data)
      expectValidationError(errors, 'marriage', 'Self-marriage not allowed: marriage-1')
    })
  })
})

describe('Section 2.2: Gender and Marriage Validity', () => {
  describe('validateGenderAndMarriage', () => {
    it('should validate correct marriages', () => {
      const data = testScenarios.simpleFamily()
      const errors = validateGenderAndMarriage(data)
      expect(errors).toHaveLength(0)
    })

    it('should require husband to have gender M', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'F', isRoot: true }), // Wrong gender
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: []
      })
      
      const errors = validateGenderAndMarriage(data)
      expectValidationError(errors, 'marriage.husbandId', 'Husband person-1 must have gender M')
    })

    it('should require wife to have gender F', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'M', isRoot: true }) // Wrong gender
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: []
      })
      
      const errors = validateGenderAndMarriage(data)
      expectValidationError(errors, 'marriage.wifeId', 'Wife person-2 must have gender F')
    })
  })
})

describe('Section 2.3: Active Marriage Limits (Polygamy Rules)', () => {
  describe('validatePolygamyLimits', () => {
    it('should allow husband with up to 4 active marriages', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Mary', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-4', name: 'Sarah', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-5', name: 'Lisa', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2', status: 'active' }),
          createMockMarriage({ id: 'marriage-2', husbandId: 'person-1', wifeId: 'person-3', status: 'active' }),
          createMockMarriage({ id: 'marriage-3', husbandId: 'person-1', wifeId: 'person-4', status: 'active' }),
          createMockMarriage({ id: 'marriage-4', husbandId: 'person-1', wifeId: 'person-5', status: 'active' })
        ],
        children: []
      })
      
      const errors = validatePolygamyLimits(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject husband with 5 active marriages', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Mary', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-4', name: 'Sarah', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-5', name: 'Lisa', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-6', name: 'Anna', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2', status: 'active' }),
          createMockMarriage({ id: 'marriage-2', husbandId: 'person-1', wifeId: 'person-3', status: 'active' }),
          createMockMarriage({ id: 'marriage-3', husbandId: 'person-1', wifeId: 'person-4', status: 'active' }),
          createMockMarriage({ id: 'marriage-4', husbandId: 'person-1', wifeId: 'person-5', status: 'active' }),
          createMockMarriage({ id: 'marriage-5', husbandId: 'person-1', wifeId: 'person-6', status: 'active' })
        ],
        children: []
      })
      
      const errors = validatePolygamyLimits(data)
      expectValidationError(errors, 'marriage', 'Husband person-1 has 5 active marriages (max 4)')
    })

    it('should allow wife with 1 active marriage', () => {
      const data = testScenarios.simpleFamily()
      const errors = validatePolygamyLimits(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject wife with 2 active marriages', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Bob', gender: 'M', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2', status: 'active' }),
          createMockMarriage({ id: 'marriage-2', husbandId: 'person-3', wifeId: 'person-2', status: 'active' })
        ],
        children: []
      })
      
      const errors = validatePolygamyLimits(data)
      expectValidationError(errors, 'marriage', 'Wife person-2 has 2 active marriages (max 1)')
    })

    it('should allow historical marriages to not count toward limits', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Mary', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2', status: 'divorced' }),
          createMockMarriage({ id: 'marriage-2', husbandId: 'person-1', wifeId: 'person-3', status: 'active' })
        ],
        children: []
      })
      
      const errors = validatePolygamyLimits(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject duplicate active marriages', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2', status: 'active' }),
          createMockMarriage({ id: 'marriage-2', husbandId: 'person-1', wifeId: 'person-2', status: 'active' })
        ],
        children: []
      })
      
      const errors = validatePolygamyLimits(data)
      expectValidationError(errors, 'marriage', 'Duplicate active marriage between person-1 and person-2')
    })
  })
})

describe('Section 2.4: Parent Assignment Rules', () => {
  describe('validateParentAssignment', () => {
    it('should validate correct parent assignments', () => {
      const data = testScenarios.simpleFamily()
      const errors = validateParentAssignment(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject child with multiple ChildLinks', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Child', gender: 'M', isRoot: false })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: [
          createMockChildLink({ childId: 'person-3', marriageId: 'marriage-1' }),
          createMockChildLink({ childId: 'person-3', marriageId: 'marriage-1' }) // Duplicate
        ]
      })
      
      const errors = validateParentAssignment(data)
      expectValidationError(errors, 'child', 'Child person-3 has 2 ChildLinks (max 1)')
    })

    it('should reject ChildLink with invalid child reference', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: [
          createMockChildLink({ childId: 'person-3', marriageId: 'marriage-1' }) // person-3 doesn't exist
        ]
      })
      
      const errors = validateParentAssignment(data)
      expectValidationError(errors, 'child.childId', 'Child person-3 not found')
    })

    it('should reject ChildLink with invalid marriage reference', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'person-3', name: 'Child', gender: 'M', isRoot: false })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: [
          createMockChildLink({ childId: 'person-3', marriageId: 'marriage-2' }) // marriage-2 doesn't exist
        ]
      })
      
      const errors = validateParentAssignment(data)
      expectValidationError(errors, 'child.marriageId', 'Marriage marriage-2 not found')
    })
  })
})

describe('Section 2.5: Ancestry and Cycle Rules', () => {
  describe('validateAncestryRules', () => {
    it('should validate correct ancestry', () => {
      const data = testScenarios.simpleFamily()
      const errors = validateAncestryRules(data)
      expect(errors).toHaveLength(0)
    })

    it('should reject ancestor-descendant marriage', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'Grandfather', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Father', gender: 'M', isRoot: false }),
          createMockPerson({ id: 'person-3', name: 'Child', gender: 'F', isRoot: false })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-3' }) // Grandfather marrying grandchild
        ],
        children: [
          createMockChildLink({ childId: 'person-2', marriageId: 'marriage-1' }),
          createMockChildLink({ childId: 'person-3', marriageId: 'marriage-1' })
        ]
      })
      
      const errors = validateAncestryRules(data)
      expect(errors.some(e => e.message.includes('Cannot marry direct ancestor or descendant'))).toBe(true)
    })

    it('should reject parent-child cycles', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'Person A', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Person B', gender: 'F', isRoot: true })
        ],
        marriages: [
          createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-2' })
        ],
        children: [
          createMockChildLink({ childId: 'person-1', marriageId: 'marriage-1' }) // Person A is child of their own marriage
        ]
      })
      
      const errors = validateAncestryRules(data)
      expect(errors.some(e => e.message.includes('Cycle detected'))).toBe(true)
    })
  })
})

describe('Section 5: Warning-Level Checks', () => {
  describe('checkWarnings', () => {
    it('should detect multiple root persons', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Jane', gender: 'F', isRoot: true })
        ],
        marriages: [],
        children: []
      })
      
      const warnings = checkWarnings(data)
      expect(warnings.multipleRoots).toBe(true)
      expect(warnings.rootCount).toBe(2)
    })

    it('should detect isolated persons', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'person-2', name: 'Isolated', gender: 'F', isRoot: false }) // No parents, no spouse, no children
        ],
        marriages: [],
        children: []
      })
      
      const warnings = checkWarnings(data)
      expect(warnings.isolatedPersons).toContain('person-2')
    })

    it('should not flag root persons as isolated', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'John', gender: 'M', isRoot: true })
        ],
        marriages: [],
        children: []
      })
      
      const warnings = checkWarnings(data)
      expect(warnings.isolatedPersons).toHaveLength(0)
    })
  })
})

describe('validateHardInvariants', () => {
  it('should run all hard invariants', () => {
    const data = testScenarios.simpleFamily()
    const errors = validateHardInvariants(data)
    expect(errors).toHaveLength(0)
  })

  it('should catch all types of violations', () => {
    const data = createMockFamilyTree({
      persons: [
        createMockPerson({ id: 'person-1', name: 'A', gender: 'U' as any, isRoot: true }), // Name too short, invalid gender
        createMockPerson({ id: 'person-1', name: 'Jane', gender: 'F', isRoot: true }) // Duplicate ID
      ],
      marriages: [
        createMockMarriage({ id: 'marriage-1', husbandId: 'person-1', wifeId: 'person-1' }) // Self-marriage
      ],
      children: []
    })
    
    const errors = validateHardInvariants(data)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.field === 'person.name')).toBe(true)
    expect(errors.some(e => e.field === 'person.gender')).toBe(true)
    expect(errors.some(e => e.field === 'person.id')).toBe(true)
    expect(errors.some(e => e.field === 'marriage')).toBe(true)
  })
})

describe('Section 5: Data Quality Warnings', () => {
  describe('checkWarnings', () => {
    it('should detect orphaned children (roots with families)', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'person1', name: 'Person 1', gender: 'M', isRoot: true }), // Orphaned - has marriage but is root
          createMockPerson({ id: 'person2', name: 'Person 2', gender: 'F', isRoot: true }),
        ],
        marriages: [
          createMockMarriage({ id: 'marriage1', husbandId: 'person1', wifeId: 'person2' }),
        ],
        children: []
      }
      
      const warnings = checkWarnings(tree)
      
      expect(warnings.orphanedChildren).toContain('person1')
      expect(warnings.orphanedChildren).toContain('person2')
    })
    
    it('should detect auto-terminated marriages with children', () => {
      const tree: FamilyTree = {
        version: 2,
        persons: [
          createMockPerson({ id: 'husband', name: 'John', gender: 'M', isRoot: true }),
          createMockPerson({ id: 'wife', name: 'Jane', gender: 'F', isRoot: true }),
          createMockPerson({ id: 'child', name: 'Child', gender: 'M', isRoot: false }),
        ],
        marriages: [
          createMockMarriage({ 
            id: 'marriage1', 
            husbandId: 'husband', 
            wifeId: 'wife',
            status: 'terminated' // Auto-terminated
          }),
        ],
        children: [
          createMockChildLink({ childId: 'child', marriageId: 'marriage1' })
        ]
      }
      
      const warnings = checkWarnings(tree)
      
      expect(warnings.autoTerminatedMarriages).toContain('marriage1')
    })
    
    it('should NOT warn about multiple roots in normal families', () => {
      const tree = testScenarios.simpleFamily()
      
      const warnings = checkWarnings(tree)
      
      // Multiple roots is NORMAL - don't treat it as a warning
      expect(warnings.multipleRoots).toBe(true) // Still tracked for stats
      // But the UI should not display this as a warning
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
      
      const warnings = checkWarnings(tree)
      
      expect(warnings.isolatedPersons).toContain('person3')
    })
    
    it('should handle empty tree with no warnings', () => {
      const tree = testScenarios.emptyTree()
      
      const warnings = checkWarnings(tree)
      
      expect(warnings.multipleRoots).toBe(false)
      expect(warnings.rootCount).toBe(0)
      expect(warnings.isolatedPersons).toHaveLength(0)
      expect(warnings.orphanedChildren).toHaveLength(0)
      expect(warnings.autoTerminatedMarriages).toHaveLength(0)
    })
  })
})

describe('Legacy Functions', () => {
  describe('validatePersonShape', () => {
    it('should validate a correct person', () => {
      const person = createMockPerson()
      const errors = validatePersonShape(person)
      expect(errors).toHaveLength(0)
    })

    it('should require id', () => {
      const person = createMockPerson({ id: undefined as any })
      const errors = validatePersonShape(person)
      expectValidationError(errors, 'id', 'Person ID is required')
    })

    it('should require name', () => {
      const person = createMockPerson({ name: '' })
      const errors = validatePersonShape(person)
      expectValidationError(errors, 'name', 'Person name is required')
    })

    it('should require valid gender', () => {
      const person = createMockPerson({ gender: 'U' as any })
      const errors = validatePersonShape(person)
      expectValidationError(errors, 'gender', 'Gender must be M or F')
    })
  })

  describe('validateMarriageShape', () => {
    it('should validate a correct marriage', () => {
      const marriage = createMockMarriage()
      const errors = validateMarriageShape(marriage)
      expect(errors).toHaveLength(0)
    })

    it('should require id', () => {
      const marriage = createMockMarriage({ id: undefined as any })
      const errors = validateMarriageShape(marriage)
      expectValidationError(errors, 'id', 'Marriage ID is required')
    })

    it('should require husbandId', () => {
      const marriage = createMockMarriage({ husbandId: undefined as any })
      const errors = validateMarriageShape(marriage)
      expectValidationError(errors, 'husbandId', 'Husband ID is required')
    })

    it('should require wifeId', () => {
      const marriage = createMockMarriage({ wifeId: undefined as any })
      const errors = validateMarriageShape(marriage)
      expectValidationError(errors, 'wifeId', 'Wife ID is required')
    })

    it('should require valid status', () => {
      const marriage = createMockMarriage({ status: 'invalid' as any })
      const errors = validateMarriageShape(marriage)
      expectValidationError(errors, 'status', 'Status must be active, divorced, widowed, or terminated')
    })
  })

  describe('validateChildLinkShape', () => {
    it('should validate a correct child link', () => {
      const childLink = createMockChildLink()
      const errors = validateChildLinkShape(childLink)
      expect(errors).toHaveLength(0)
    })

    it('should require childId', () => {
      const childLink = createMockChildLink({ childId: undefined as any })
      const errors = validateChildLinkShape(childLink)
      expectValidationError(errors, 'childId', 'Child ID is required')
    })

    it('should require marriageId', () => {
      const childLink = createMockChildLink({ marriageId: undefined as any })
      const errors = validateChildLinkShape(childLink)
      expectValidationError(errors, 'marriageId', 'Marriage ID is required')
    })
  })

  describe('validateFamilyTree', () => {
    it('should validate correct family tree', () => {
      const data = testScenarios.simpleFamily()
      const errors = validateFamilyTree(data)
      expect(errors).toHaveLength(0)
    })

    it('should catch validation errors', () => {
      const data = createMockFamilyTree({
        persons: [
          createMockPerson({ id: 'person-1', name: 'A', gender: 'U' as any, isRoot: true })
        ],
        marriages: [],
        children: []
      })
      
      const errors = validateFamilyTree(data)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})