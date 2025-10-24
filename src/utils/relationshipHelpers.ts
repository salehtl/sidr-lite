import type { Person } from '../types/domain'

export function validateGenderForMarriage(person1: Person, person2: Person): boolean {
  // Both must have known genders
  if (person1.gender === 'U' || person2.gender === 'U') {
    return false
  }
  
  // Must be opposite genders
  return person1.gender !== person2.gender
}

export function canBeSpouse(person: Person, target: Person): boolean {
  // Can't marry self
  if (person.id === target.id) {
    return false
  }
  
  // Must be opposite genders (or at least one unknown for flexibility)
  if (person.gender !== 'U' && target.gender !== 'U') {
    return person.gender !== target.gender
  }
  
  // If one is unknown, allow it (user can specify later)
  return true
}

export function getEligibleSpouses(persons: Person[], targetPerson: Person): Person[] {
  return persons.filter(person => canBeSpouse(targetPerson, person))
}

export function determineHusbandWife(person1: Person, person2: Person): { husbandId: string, wifeId: string } {
  // If both have known genders, use them
  if (person1.gender !== 'U' && person2.gender !== 'U') {
    if (person1.gender === 'M' && person2.gender === 'F') {
      return { husbandId: person1.id, wifeId: person2.id }
    } else if (person1.gender === 'F' && person2.gender === 'M') {
      return { husbandId: person2.id, wifeId: person1.id }
    } else {
      throw new Error('Cannot determine husband/wife: both persons have same gender')
    }
  }
  
  // If one is unknown, assume the known gender determines the role
  if (person1.gender === 'M') {
    return { husbandId: person1.id, wifeId: person2.id }
  } else if (person1.gender === 'F') {
    return { husbandId: person2.id, wifeId: person1.id }
  } else if (person2.gender === 'M') {
    return { husbandId: person2.id, wifeId: person1.id }
  } else if (person2.gender === 'F') {
    return { husbandId: person1.id, wifeId: person2.id }
  }
  
  // Both unknown - default to first person as husband
  return { husbandId: person1.id, wifeId: person2.id }
}

export function getGenderErrorMessage(person1: Person, person2: Person): string {
  if (person1.gender === 'U' && person2.gender === 'U') {
    return 'Both persons have unknown gender. Please set at least one person\'s gender to create a marriage.'
  }
  
  if (person1.gender === person2.gender && person1.gender !== 'U') {
    return `Cannot create marriage between two ${person1.gender === 'M' ? 'men' : 'women'}. Please select persons of different genders.`
  }
  
  return 'Cannot create marriage with these persons.'
}
