export type Gender = 'M' | 'F'
export type MarriageStatus = 'active' | 'divorced' | 'widowed' | 'terminated'
export type RelationshipType = 'root' | 'spouse' | 'child' | 'parent' | 'sibling'

export interface Person {
  id: string
  name: string
  gender: Gender
  isRoot: boolean // derived: true if this person is not a child in any ChildLink
}

export interface Marriage {
  id: string
  husbandId: string | null  // Allow null for incomplete parent pairs
  wifeId: string | null      // Allow null for incomplete parent pairs
  status: MarriageStatus
  marriageDate: string | null
  divorceDate: string | null
}

export interface ChildLink {
  childId: string
  marriageId: string
}

export interface FamilyTree {
  version: number
  persons: Person[]
  marriages: Marriage[]
  children: ChildLink[]
}

// In-memory indices for fast lookups
export interface FamilyTreeIndices {
  personById: Map<string, Person>
  marriagesByHusband: Map<string, Marriage[]>
  marriagesByWife: Map<string, Marriage[]>
  childrenByMarriage: Map<string, ChildLink[]>
  childrenByChild: Map<string, ChildLink>
}

// Store state
export interface FamilyTreeState {
  data: FamilyTree
  indices: FamilyTreeIndices
  selectedPersonId: string | null
  selectedMarriageId: string | null
  isRTL: boolean
  prefilledForm: {
    relationshipType: RelationshipType | null
    targetId: string | null
    targetType: 'person' | 'marriage' | null
  } | null
}

// Store actions
export interface FamilyTreeActions {
  // Core operations
  createPerson: (name: string, gender: Gender) => string
  createMarriage: (personAId: string | null, personBId: string | null) => string
  addChild: (marriageId: string, name: string, gender: Gender) => string
  setMarriageStatus: (marriageId: string, status: MarriageStatus) => void
  setRoot: (personId: string) => void
  
  // Advanced relationship operations
  addSibling: (personId: string, siblingName: string, siblingGender: Gender) => string
  addParent: (childId: string, parentName: string, parentGender: Gender) => string
  completeParentMarriage: (marriageId: string, secondParentId: string) => void

  // Deletion operations
  deletePerson: (options: { personId: string, forceOrphan?: boolean, forceRootDelete?: boolean }) => { deletedPerson: Person, deletedMarriages: Marriage[], deletedChildLinks: ChildLink[], orphanedChildren: Person[] }

  // Update operations
  updatePersonName: (personId: string, newName: string) => void
  updatePersonGender: (personId: string, newGender: Gender) => void
  updateMarriageDates: (marriageId: string, marriageDate: string | null, divorceDate: string | null) => void

  // Selection
  selectPerson: (personId: string | null) => void
  selectMarriage: (marriageId: string | null) => void
  
  // UI state
  setRTL: (isRTL: boolean) => void
  setPrefilledForm: (prefilled: { relationshipType: RelationshipType, targetId: string, targetType: 'person' | 'marriage' } | null) => void

  // Data management
  loadData: (data: FamilyTree) => void
  exportData: () => FamilyTree
  clearData: () => void

  // Internal helpers
  rebuildIndices: () => void
}
