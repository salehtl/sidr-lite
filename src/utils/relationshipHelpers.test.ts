import { describe, it, expect } from 'vitest'
import {
  validateGenderForMarriage,
  canBeSpouse,
  getEligibleSpouses,
  determineHusbandWife,
  getGenderErrorMessage
} from './relationshipHelpers'
import { createMockPerson } from '../test-utils'
import type { Person } from '../types/domain'

describe('validateGenderForMarriage', () => {
  it('should return true for opposite genders', () => {
    const person1 = createMockPerson({ gender: 'M' })
    const person2 = createMockPerson({ gender: 'F' })
    const result = validateGenderForMarriage(person1, person2)
    expect(result).toBe(true)
  })

  it('should return true for F-M combination', () => {
    const person1 = createMockPerson({ gender: 'F' })
    const person2 = createMockPerson({ gender: 'M' })
    const result = validateGenderForMarriage(person1, person2)
    expect(result).toBe(true)
  })

  it('should return false for same gender (M-M)', () => {
    const person1 = createMockPerson({ gender: 'M' })
    const person2 = createMockPerson({ gender: 'M' })
    const result = validateGenderForMarriage(person1, person2)
    expect(result).toBe(false)
  })

  it('should return false for same gender (F-F)', () => {
    const person1 = createMockPerson({ gender: 'F' })
    const person2 = createMockPerson({ gender: 'F' })
    const result = validateGenderForMarriage(person1, person2)
    expect(result).toBe(false)
  })
})

describe('canBeSpouse', () => {
  it('should return true for opposite genders', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const person2 = createMockPerson({ id: 'person2', gender: 'F' })
    const result = canBeSpouse(person1, person2)
    expect(result).toBe(true)
  })

  it('should return true for F-M combination', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'F' })
    const person2 = createMockPerson({ id: 'person2', gender: 'M' })
    const result = canBeSpouse(person1, person2)
    expect(result).toBe(true)
  })

  it('should return false for same person', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const result = canBeSpouse(person1, person1)
    expect(result).toBe(false)
  })

  it('should return false for same gender (M-M)', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const person2 = createMockPerson({ id: 'person2', gender: 'M' })
    const result = canBeSpouse(person1, person2)
    expect(result).toBe(false)
  })

  it('should return false for same gender (F-F)', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'F' })
    const person2 = createMockPerson({ id: 'person2', gender: 'F' })
    const result = canBeSpouse(person1, person2)
    expect(result).toBe(false)
  })
})

describe('getEligibleSpouses', () => {
  it('should return opposite gender persons', () => {
    const targetPerson = createMockPerson({ id: 'target', gender: 'M' })
    const persons: Person[] = [
      createMockPerson({ id: 'eligible1', gender: 'F' }),
      createMockPerson({ id: 'eligible2', gender: 'F' }),
      createMockPerson({ id: 'sameGender', gender: 'M' }),
      createMockPerson({ id: 'target', gender: 'M' }), // Same person
    ]
    
    const result = getEligibleSpouses(persons, targetPerson)
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['eligible1', 'eligible2'])
  })

  it('should return opposite gender persons for female target', () => {
    const targetPerson = createMockPerson({ id: 'target', gender: 'F' })
    const persons: Person[] = [
      createMockPerson({ id: 'eligible1', gender: 'M' }),
      createMockPerson({ id: 'eligible2', gender: 'M' }),
      createMockPerson({ id: 'sameGender', gender: 'F' }),
      createMockPerson({ id: 'target', gender: 'F' }), // Same person
    ]
    
    const result = getEligibleSpouses(persons, targetPerson)
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['eligible1', 'eligible2'])
  })

  it('should return empty array when no eligible spouses', () => {
    const targetPerson = createMockPerson({ id: 'target', gender: 'M' })
    const persons: Person[] = [
      createMockPerson({ id: 'sameGender1', gender: 'M' }),
      createMockPerson({ id: 'sameGender2', gender: 'M' }),
      createMockPerson({ id: 'target', gender: 'M' }), // Same person
    ]
    
    const result = getEligibleSpouses(persons, targetPerson)
    expect(result).toHaveLength(0)
  })

  it('should handle empty persons array', () => {
    const targetPerson = createMockPerson({ id: 'target', gender: 'M' })
    const persons: Person[] = []
    
    const result = getEligibleSpouses(persons, targetPerson)
    expect(result).toHaveLength(0)
  })
})

describe('determineHusbandWife', () => {
  it('should assign M as husband and F as wife', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const person2 = createMockPerson({ id: 'person2', gender: 'F' })
    
    const result = determineHusbandWife(person1, person2)
    expect(result).toEqual({ husbandId: 'person1', wifeId: 'person2' })
  })

  it('should assign F as wife and M as husband (reverse order)', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'F' })
    const person2 = createMockPerson({ id: 'person2', gender: 'M' })
    
    const result = determineHusbandWife(person1, person2)
    expect(result).toEqual({ husbandId: 'person2', wifeId: 'person1' })
  })

  it('should throw error for same gender (M-M)', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const person2 = createMockPerson({ id: 'person2', gender: 'M' })
    
    expect(() => determineHusbandWife(person1, person2)).toThrow(
      'Cannot determine husband/wife: both persons have same gender'
    )
  })

  it('should throw error for same gender (F-F)', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'F' })
    const person2 = createMockPerson({ id: 'person2', gender: 'F' })
    
    expect(() => determineHusbandWife(person1, person2)).toThrow(
      'Cannot determine husband/wife: both persons have same gender'
    )
  })
})

describe('getGenderErrorMessage', () => {
  it('should return error message for M-M marriage', () => {
    const person1 = createMockPerson({ gender: 'M' })
    const person2 = createMockPerson({ gender: 'M' })
    
    const result = getGenderErrorMessage(person1, person2)
    expect(result).toBe('Cannot create marriage between two men. Please select persons of different genders.')
  })

  it('should return error message for F-F marriage', () => {
    const person1 = createMockPerson({ gender: 'F' })
    const person2 = createMockPerson({ gender: 'F' })
    
    const result = getGenderErrorMessage(person1, person2)
    expect(result).toBe('Cannot create marriage between two women. Please select persons of different genders.')
  })

  it('should return generic error for opposite genders', () => {
    const person1 = createMockPerson({ gender: 'M' })
    const person2 = createMockPerson({ gender: 'F' })
    
    const result = getGenderErrorMessage(person1, person2)
    expect(result).toBe('Cannot create marriage with these persons.')
  })

  it('should return generic error for F-M combination', () => {
    const person1 = createMockPerson({ gender: 'F' })
    const person2 = createMockPerson({ gender: 'M' })
    
    const result = getGenderErrorMessage(person1, person2)
    expect(result).toBe('Cannot create marriage with these persons.')
  })
})

describe('Edge cases and integration', () => {
  it('should handle persons with same ID but different genders', () => {
    const person1 = createMockPerson({ id: 'same-id', gender: 'M' })
    const person2 = createMockPerson({ id: 'same-id', gender: 'F' })
    
    // This is an invalid scenario in real usage, but tests the logic
    const canBeSpouseResult = canBeSpouse(person1, person2)
    expect(canBeSpouseResult).toBe(false) // Same ID prevents marriage
    
    const validateResult = validateGenderForMarriage(person1, person2)
    expect(validateResult).toBe(true) // But genders are opposite
  })

  it('should handle persons with different IDs but same gender', () => {
    const person1 = createMockPerson({ id: 'person1', gender: 'M' })
    const person2 = createMockPerson({ id: 'person2', gender: 'M' })
    
    const canBeSpouseResult = canBeSpouse(person1, person2)
    expect(canBeSpouseResult).toBe(false) // Same gender prevents marriage
    
    const validateResult = validateGenderForMarriage(person1, person2)
    expect(validateResult).toBe(false) // Same gender prevents marriage
  })

  it('should work correctly with real-world scenarios', () => {
    // Test with a realistic family scenario
    const husband = createMockPerson({ id: 'husband', name: 'John', gender: 'M' })
    const wife = createMockPerson({ id: 'wife', name: 'Jane', gender: 'F' })
    const son = createMockPerson({ id: 'son', name: 'Bob', gender: 'M' })
    const daughter = createMockPerson({ id: 'daughter', name: 'Alice', gender: 'F' })
    
    // Husband and wife should be able to marry
    expect(canBeSpouse(husband, wife)).toBe(true)
    expect(validateGenderForMarriage(husband, wife)).toBe(true)
    
    // Son and daughter should be able to marry (siblings marrying is allowed by gender rules)
    expect(canBeSpouse(son, daughter)).toBe(true)
    expect(validateGenderForMarriage(son, daughter)).toBe(true)
    
    // Same gender marriages should be prevented
    expect(canBeSpouse(husband, son)).toBe(false)
    expect(canBeSpouse(wife, daughter)).toBe(false)
    expect(validateGenderForMarriage(husband, son)).toBe(false)
    expect(validateGenderForMarriage(wife, daughter)).toBe(false)
    
    // Self-marriage should be prevented
    expect(canBeSpouse(husband, husband)).toBe(false)
    expect(canBeSpouse(wife, wife)).toBe(false)
  })

  it('should handle large lists of eligible spouses efficiently', () => {
    const targetPerson = createMockPerson({ id: 'target', gender: 'M' })
    const persons: Person[] = []
    
    // Create 1000 persons with mixed genders
    for (let i = 0; i < 1000; i++) {
      persons.push(createMockPerson({ 
        id: `person${i}`, 
        gender: i % 2 === 0 ? 'F' : 'M' 
      }))
    }
    
    const result = getEligibleSpouses(persons, targetPerson)
    expect(result).toHaveLength(500) // Should be exactly half (F persons)
    expect(result.every(p => p.gender === 'F')).toBe(true)
  })
})
