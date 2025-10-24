import { create } from 'zustand'
import type { FamilyTreeState, FamilyTreeActions, FamilyTree, Person, Marriage, ChildLink, FamilyTreeIndices, Gender, MarriageStatus, RelationshipType } from '../types/domain'
import { validateFamilyTree, ValidationError } from './validators'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { validateGenderForMarriage, determineHusbandWife, getGenderErrorMessage } from '../utils/relationshipHelpers'
import { calculateDeletionImpact, canDeletePerson } from '../utils/deletionHelpers'

// Generate unique ID with fallback
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback to base36 nanoid-like approach
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Build indices from data
function buildIndices(data: FamilyTree): FamilyTreeIndices {
  const personById = new Map(data.persons.map(p => [p.id, p]))
  
  const marriagesByHusband = new Map<string, Marriage[]>()
  const marriagesByWife = new Map<string, Marriage[]>()
  
  for (const marriage of data.marriages) {
    if (!marriagesByHusband.has(marriage.husbandId)) {
      marriagesByHusband.set(marriage.husbandId, [])
    }
    marriagesByHusband.get(marriage.husbandId)!.push(marriage)
    
    if (!marriagesByWife.has(marriage.wifeId)) {
      marriagesByWife.set(marriage.wifeId, [])
    }
    marriagesByWife.get(marriage.wifeId)!.push(marriage)
  }
  
  const childrenByMarriage = new Map<string, ChildLink[]>()
  const childrenByChild = new Map<string, ChildLink>()
  
  for (const child of data.children) {
    if (!childrenByMarriage.has(child.marriageId)) {
      childrenByMarriage.set(child.marriageId, [])
    }
    childrenByMarriage.get(child.marriageId)!.push(child)
    childrenByChild.set(child.childId, child)
  }
  
  return {
    personById,
    marriagesByHusband,
    marriagesByWife,
    childrenByMarriage,
    childrenByChild
  }
}

const useFamilyTreeStore = create<FamilyTreeState & FamilyTreeActions>((set, get) => ({
  // Initial state
  data: loadFromStorage(),
  indices: buildIndices(loadFromStorage()),
  selectedPersonId: null,
  selectedMarriageId: null,
  isRTL: false,
  prefilledForm: null,
  
  // Core operations
  createPerson: (name: string, gender: Gender) => {
    const state = get()
    const id = generateId()
    
    // If this is the first person, make them root
    const isRoot = state.data.persons.length === 0
    
    const person: Person = {
      id,
      name: name.trim(),
      gender,
      isRoot
    }
    
    const newData: FamilyTree = {
      ...state.data,
      persons: [...state.data.persons, person]
    }
    
    // Validate before saving
    const errors = validateFamilyTree(newData)
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    set({
      data: newData,
      indices: buildIndices(newData)
    })
    
    // Auto-save
    saveToStorage(newData)
    
    return id
  },
  
  createMarriage: (personAId: string, personBId: string) => {
    const state = get()
    
    // Validate persons exist
    if (!state.indices.personById.has(personAId)) {
      throw new Error('First person not found')
    }
    if (!state.indices.personById.has(personBId)) {
      throw new Error('Second person not found')
    }
    
    const personA = state.indices.personById.get(personAId)!
    const personB = state.indices.personById.get(personBId)!
    
    // Validate gender compatibility
    if (!validateGenderForMarriage(personA, personB)) {
      throw new Error(getGenderErrorMessage(personA, personB))
    }
    
    // Determine husband and wife based on gender
    const { husbandId, wifeId } = determineHusbandWife(personA, personB)
    
    // Check for duplicate marriage
    const existingMarriage = state.data.marriages.find(
      m => (m.husbandId === husbandId && m.wifeId === wifeId) ||
           (m.husbandId === wifeId && m.wifeId === husbandId)
    )
    if (existingMarriage) {
      throw new Error('Marriage already exists between these persons')
    }
    
    // Check polygamy limits
    const husbandMarriages = state.indices.marriagesByHusband.get(husbandId) || []
    const activeHusbandMarriages = husbandMarriages.filter(m => m.status === 'active')
    if (activeHusbandMarriages.length >= 4) {
      throw new Error('Husband already has 4 active marriages')
    }
    
    const wifeMarriages = state.indices.marriagesByWife.get(wifeId) || []
    const activeWifeMarriages = wifeMarriages.filter(m => m.status === 'active')
    if (activeWifeMarriages.length >= 1) {
      throw new Error('Wife already has an active marriage')
    }
    
    const id = generateId()
    const marriage: Marriage = {
      id,
      husbandId,
      wifeId,
      status: 'active',
      marriageDate: null,
      divorceDate: null
    }
    
    const newData: FamilyTree = {
      ...state.data,
      marriages: [...state.data.marriages, marriage]
    }
    
    // Validate before saving
    const errors = validateFamilyTree(newData)
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    set({
      data: newData,
      indices: buildIndices(newData)
    })
    
    // Auto-save
    saveToStorage(newData)
    
    return id
  },
  
  addChild: (marriageId: string, name: string, gender: Gender) => {
    const state = get()
    
    // Validate marriage exists
    const marriage = state.data.marriages.find(m => m.id === marriageId)
    if (!marriage) {
      throw new Error('Marriage not found')
    }
    
    // Create child with provided name and gender
    const childId = get().createPerson(name, gender)
    
    // Get the updated state after creating the child
    const updatedState = get()
    
    const childLink: ChildLink = {
      childId,
      marriageId
    }
    
    const newData: FamilyTree = {
      ...updatedState.data,
      children: [...updatedState.data.children, childLink]
    }
    
    // Validate before saving
    const errors = validateFamilyTree(newData)
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    set({
      data: newData,
      indices: buildIndices(newData)
    })
    
    // Auto-save
    saveToStorage(newData)
    
    return childId
  },
  
  setMarriageStatus: (marriageId: string, status: MarriageStatus) => {
    const state = get()
    
    const marriage = state.data.marriages.find(m => m.id === marriageId)
    if (!marriage) {
      throw new Error('Marriage not found')
    }
    
    const updatedMarriage = { ...marriage, status }
    const newData: FamilyTree = {
      ...state.data,
      marriages: state.data.marriages.map(m => 
        m.id === marriageId ? updatedMarriage : m
      )
    }
    
    set({
      data: newData,
      indices: buildIndices(newData)
    })
    
    // Auto-save
    saveToStorage(newData)
  },
  
  setRoot: (personId: string) => {
    const state = get()
    
    if (!state.indices.personById.has(personId)) {
      throw new Error('Person not found')
    }
    
    // Remove root status from all persons
    const updatedPersons = state.data.persons.map(p => ({ ...p, isRoot: false }))
    
    // Set new root
    const newData: FamilyTree = {
      ...state.data,
      persons: updatedPersons.map(p => 
        p.id === personId ? { ...p, isRoot: true } : p
      )
    }
    
    set({
      data: newData,
      indices: buildIndices(newData)
    })
    
    // Auto-save
    saveToStorage(newData)
  },
  
  // Selection
  selectPerson: (personId: string | null) => {
    set({ selectedPersonId: personId })
  },
  
  selectMarriage: (marriageId: string | null) => {
    set({ selectedMarriageId: marriageId })
  },
  
  // UI state
  setRTL: (isRTL: boolean) => {
    set({ isRTL })
    localStorage.setItem('family-tree-rtl', isRTL.toString())
  },

  setPrefilledForm: (prefilled: { relationshipType: RelationshipType, targetId: string, targetType: 'person' | 'marriage' } | null) => {
    set({ prefilledForm: prefilled })
  },
  
  // Data management
  loadData: (data: FamilyTree) => {
    // Validate data before loading
    const errors = validateFamilyTree(data)
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    set({
      data,
      indices: buildIndices(data)
    })
    
    saveToStorage(data)
  },
  
  exportData: () => {
    return get().data
  },
  
  clearData: () => {
    const emptyData: FamilyTree = {
      version: 1,
      persons: [],
      marriages: [],
      children: []
    }
    
    set({
      data: emptyData,
      indices: buildIndices(emptyData),
      selectedPersonId: null,
      selectedMarriageId: null
    })
    
    saveToStorage(emptyData)
  },
  
  // Advanced relationship operations
  addSibling: (personId: string, siblingName: string, siblingGender: Gender) => {
    const state = get()
    
    if (!state.indices.personById.has(personId)) {
      throw new Error('Person not found')
    }
    
    // Find the person's parents (marriage)
    const parentsMarriage = state.data.children.find(c => c.childId === personId)
    if (!parentsMarriage) {
      throw new Error('Cannot add sibling: person has no parents')
    }
    
    // Create the sibling
    const siblingId = get().createPerson(siblingName, siblingGender)
    
    // Add the sibling to the same marriage
    get().addChild(parentsMarriage.marriageId, siblingName, siblingGender)
    
    return siblingId
  },
  
  addParent: (childId: string, parentName: string, parentGender: Gender) => {
    const state = get()
    
    if (!state.indices.personById.has(childId)) {
      throw new Error('Child not found')
    }
    
    // Create the parent
    const parentId = get().createPerson(parentName, parentGender)
    
    // Find existing parent of the child
    const existingParentMarriage = state.data.children.find(c => c.childId === childId)
    if (existingParentMarriage) {
      // Child already has parents - create marriage with existing parent
      const marriage = state.data.marriages.find(m => m.id === existingParentMarriage.marriageId)
      if (marriage) {
        // Get the existing parent (the one who isn't the child)
        const existingParentId = marriage.husbandId === childId ? marriage.wifeId : marriage.husbandId
        if (existingParentId !== childId) {
          // Create marriage between new parent and existing parent
          get().createMarriage(parentId, existingParentId)
        }
      }
    } else {
      // Child has no parents yet - create a placeholder marriage
      // We need to create a placeholder spouse for the new parent
      const placeholderGender = parentGender === 'M' ? 'F' : 'M'
      const placeholderId = get().createPerson('Unknown Spouse', placeholderGender)
      
      // Create marriage between new parent and placeholder
      get().createMarriage(parentId, placeholderId)
      
      // Add child to this marriage
      const newMarriage = state.data.marriages.find(m => 
        (m.husbandId === parentId && m.wifeId === placeholderId) ||
        (m.husbandId === placeholderId && m.wifeId === parentId)
      )
      if (newMarriage) {
        get().addChild(newMarriage.id, 'Unknown Child', 'U')
      }
    }
    
    return parentId
  },

  deletePerson: (personId: string, force: boolean = false) => {
    const state = get()
    
    // Check if person exists
    if (!state.indices.personById.has(personId)) {
      throw new Error('Person not found')
    }
    
    const person = state.indices.personById.get(personId)!
    
    // Check if this is the root person
    if (person.isRoot && !force) {
      throw new Error('Cannot delete root person without force flag')
    }
    
    // Calculate deletion impact
    const impact = calculateDeletionImpact(personId, state.data)
    
    // Check if we can delete (last person check)
    const { canDelete, reason } = canDeletePerson(personId, state.data)
    if (!canDelete) {
      throw new Error(reason || 'Cannot delete person')
    }
    
    // Perform cascade deletion
    const newData: FamilyTree = {
      ...state.data,
      persons: state.data.persons.filter(p => p.id !== personId),
      marriages: state.data.marriages.filter(m => 
        m.husbandId !== personId && m.wifeId !== personId
      ),
      children: state.data.children.filter(c => 
        !impact.marriagesToDelete.some(m => m.id === c.marriageId)
      )
    }
    
    // If this was the last person, clear everything
    if (newData.persons.length === 0) {
      const emptyData: FamilyTree = {
        version: 1,
        persons: [],
        marriages: [],
        children: []
      }
      
      set({
        data: emptyData,
        indices: buildIndices(emptyData),
        selectedPersonId: null,
        selectedMarriageId: null
      })
      
      saveToStorage(emptyData)
      
      return {
        deletedPerson: person,
        deletedMarriages: impact.marriagesToDelete,
        deletedChildLinks: impact.childLinksToDelete,
        orphanedChildren: impact.orphanedChildren
      }
    }
    
    // Validate before saving
    const errors = validateFamilyTree(newData)
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    // Clear selection if deleted person was selected
    const newSelectedPersonId = state.selectedPersonId === personId ? null : state.selectedPersonId
    const newSelectedMarriageId = impact.marriagesToDelete.some(m => m.id === state.selectedMarriageId) 
      ? null 
      : state.selectedMarriageId
    
    set({
      data: newData,
      indices: buildIndices(newData),
      selectedPersonId: newSelectedPersonId,
      selectedMarriageId: newSelectedMarriageId
    })
    
    // Auto-save
    saveToStorage(newData)
    
      return {
        deletedPerson: person,
        deletedMarriages: impact.marriagesToDelete,
        deletedChildLinks: impact.childLinksToDelete,
        orphanedChildren: impact.orphanedChildren
      }
    },

    updatePersonName: (personId: string, newName: string) => {
      const state = get()

      if (!state.indices.personById.has(personId)) {
        throw new Error('Person not found')
      }

      if (!newName.trim() || newName.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }

      const newData: FamilyTree = {
        ...state.data,
        persons: state.data.persons.map(p => 
          p.id === personId ? { ...p, name: newName.trim() } : p
        )
      }

      const errors = validateFamilyTree(newData)
      if (errors.length > 0) {
        throw new ValidationError(errors)
      }

      set({
        data: newData,
        indices: buildIndices(newData)
      })

      saveToStorage(newData)
    },

    updatePersonGender: (personId: string, newGender: Gender) => {
      const state = get()

      if (!state.indices.personById.has(personId)) {
        throw new Error('Person not found')
      }

      const newData: FamilyTree = {
        ...state.data,
        persons: state.data.persons.map(p => 
          p.id === personId ? { ...p, gender: newGender } : p
        )
      }

      const errors = validateFamilyTree(newData)
      if (errors.length > 0) {
        throw new ValidationError(errors)
      }

      set({
        data: newData,
        indices: buildIndices(newData)
      })

      saveToStorage(newData)
    },

    updateMarriageDates: (marriageId: string, marriageDate: string | null, divorceDate: string | null) => {
      const state = get()

      if (!state.data.marriages.some(m => m.id === marriageId)) {
        throw new Error('Marriage not found')
      }

      const newData: FamilyTree = {
        ...state.data,
        marriages: state.data.marriages.map(m => 
          m.id === marriageId ? { ...m, marriageDate, divorceDate } : m
        )
      }

      const errors = validateFamilyTree(newData)
      if (errors.length > 0) {
        throw new ValidationError(errors)
      }

      set({
        data: newData,
        indices: buildIndices(newData)
      })

      saveToStorage(newData)
    },
  
  // Internal helpers
  rebuildIndices: () => {
    const state = get()
    set({ indices: buildIndices(state.data) })
  }
}))

export { useFamilyTreeStore }
export default useFamilyTreeStore
