import type { Person } from '../types/domain'

export function validateGenderForMarriage(person1: Person, person2: Person): boolean {
  // Must be opposite genders
  return person1.gender !== person2.gender
}

export function canBeSpouse(person: Person, target: Person): boolean {
  // Can't marry self
  if (person.id === target.id) {
    return false
  }
  
  // Must be opposite genders
  return person.gender !== target.gender
}

export function getEligibleSpouses(persons: Person[], targetPerson: Person): Person[] {
  return persons.filter(person => canBeSpouse(targetPerson, person))
}

export function determineHusbandWife(person1: Person, person2: Person): { husbandId: string, wifeId: string } {
  if (person1.gender === 'M' && person2.gender === 'F') {
    return { husbandId: person1.id, wifeId: person2.id }
  } else if (person1.gender === 'F' && person2.gender === 'M') {
    return { husbandId: person2.id, wifeId: person1.id }
  } else {
    throw new Error('Cannot determine husband/wife: both persons have same gender')
  }
}

export function getGenderErrorMessage(person1: Person, person2: Person): string {
  if (person1.gender === person2.gender) {
    return `Cannot create marriage between two ${person1.gender === 'M' ? 'men' : 'women'}. Please select persons of different genders.`
  }
  
  return 'Cannot create marriage with these persons.'
}
