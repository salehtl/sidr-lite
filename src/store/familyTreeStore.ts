import { create } from 'zustand'
import type { FamilyTreeState, FamilyTreeActions, FamilyTree, Person, Marriage, ChildLink, FamilyTreeIndices, Gender, MarriageStatus, RelationshipType } from '../types/domain'
import { validateAndCommit } from './validationExecutor'
import type { ValidationWarnings } from './validationExecutor'
import { validateHardInvariants } from './validators'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { determineHusbandWife } from '../utils/relationshipHelpers'
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
    if (marriage.husbandId) {
      if (!marriagesByHusband.has(marriage.husbandId)) {
        marriagesByHusband.set(marriage.husbandId, [])
      }
      marriagesByHusband.get(marriage.husbandId)!.push(marriage)
    }
    
    if (marriage.wifeId) {
      if (!marriagesByWife.has(marriage.wifeId)) {
        marriagesByWife.set(marriage.wifeId, [])
      }
      marriagesByWife.get(marriage.wifeId)!.push(marriage)
    }
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
    
    const resultData = validateAndCommit(
      state.data,
      (data) => {
        const person: Person = {
          id,
          name: name.trim(),
          gender,
          isRoot: false // Will be recalculated
        }
        
        return {
          ...data,
          persons: [...data.persons, person]
        }
      },
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
      }
    )
    
    set({
      data: resultData,
      indices: buildIndices(resultData)
    })
    
    // Auto-save
    saveToStorage(resultData)
    
    return id
  },
  
  createMarriage: (personAId: string | null, personBId: string | null) => {
    const state = get()
    
    // Handle null spouse parameters for incomplete parent marriages
    if (personAId === null && personBId === null) {
      throw new Error('At least one spouse must be provided')
    }
    
    // Validate persons exist (if not null)
    if (personAId && !state.indices.personById.has(personAId)) {
      throw new Error('First person not found')
    }
    if (personBId && !state.indices.personById.has(personBId)) {
      throw new Error('Second person not found')
    }
    
    let husbandId: string | null = null
    let wifeId: string | null = null
    
    if (personAId && personBId) {
      // Complete marriage - determine husband and wife based on gender
      const personA = state.indices.personById.get(personAId)!
      const personB = state.indices.personById.get(personBId)!
      const result = determineHusbandWife(personA, personB)
      husbandId = result.husbandId
      wifeId = result.wifeId
    } else if (personAId) {
      // Single parent marriage - determine role based on gender
      const person = state.indices.personById.get(personAId)!
      if (person.gender === 'M') {
        husbandId = personAId
      } else {
        wifeId = personAId
      }
    } else if (personBId) {
      // Single parent marriage - determine role based on gender
      const person = state.indices.personById.get(personBId)!
      if (person.gender === 'M') {
        husbandId = personBId
      } else {
        wifeId = personBId
      }
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
    
    const resultData = validateAndCommit(
      state.data,
      (data) => ({
        ...data,
        marriages: [...data.marriages, marriage]
      }),
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
      }
    )
    
    set({
      data: resultData,
      indices: buildIndices(resultData)
    })
    
    // Auto-save
    saveToStorage(resultData)
    
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
    
    const resultData = validateAndCommit(
      updatedState.data,
      (data) => ({
        ...data,
        children: [...data.children, childLink]
      }),
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
      }
    )
    
    set({
      data: resultData,
      indices: buildIndices(resultData)
    })
    
    // Auto-save
    saveToStorage(resultData)
    
    return childId
  },
  
  setMarriageStatus: (marriageId: string, status: MarriageStatus) => {
    const state = get()
    
    const marriage = state.data.marriages.find(m => m.id === marriageId)
    if (!marriage) {
      throw new Error('Marriage not found')
    }
    
    // Validate status transitions
    if (marriage.status === 'divorced' && status === 'active') {
      throw new Error('Cannot reactivate a divorced marriage. Create a new marriage record for remarriage.')
    }
    
    const resultData = validateAndCommit(
      state.data,
      (data) => ({
        ...data,
        marriages: data.marriages.map(m => 
          m.id === marriageId ? { ...m, status } : m
        )
      }),
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
      }
    )
    
    set({
      data: resultData,
      indices: buildIndices(resultData)
    })
    
    // Auto-save
    saveToStorage(resultData)
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
    // Validate data before loading using the new validation system
    const errors = validateHardInvariants(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
    }
    
    set({
      data,
      indices: buildIndices(data)
    })
    
    saveToStorage(data)
  },

  setRoot: (personId: string) => {
    const state = get()
    
    if (!state.indices.personById.has(personId)) {
      throw new Error('Person not found')
    }

    const resultData = validateAndCommit(
      state.data,
      (data) => ({
        ...data,
        persons: data.persons.map(p => ({
          ...p,
          isRoot: p.id === personId
        }))
      }),
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
      }
    )

    set({
      data: resultData,
      indices: buildIndices(resultData)
    })

    saveToStorage(resultData)
  },
  
  exportData: () => {
    return get().data
  },
  
  clearData: () => {
    const emptyData: FamilyTree = {
      version: 2,
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
    
    // Add the sibling to the same marriage (addChild creates the person internally)
    const siblingId = get().addChild(parentsMarriage.marriageId, siblingName, siblingGender)
    
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
    const existingParentLink = state.data.children.find(c => c.childId === childId)
    
    if (existingParentLink) {
      // Child already has a marriage - check if it's incomplete
      const marriage = state.data.marriages.find(m => m.id === existingParentLink.marriageId)
      
      if (marriage) {
        const isIncomplete = !marriage.husbandId || !marriage.wifeId
        
        if (isIncomplete) {
          // Complete the existing marriage
          get().completeParentMarriage(marriage.id, parentId)
        } else {
          // Marriage is complete - this shouldn't happen per domain rules
          throw new Error('Child already has two parents')
        }
      }
    } else {
      // Child has no parents yet - create single-parent marriage
      const marriageId = get().createMarriage(parentId, null)
      
      // Link child to marriage
      const childLink: ChildLink = { childId, marriageId }
      
      const resultData = validateAndCommit(
        state.data,
        (data) => ({ ...data, children: [...data.children, childLink] }),
        (warnings) => console.warn('Parent creation warnings:', warnings)
      )
      
      set({ data: resultData, indices: buildIndices(resultData) })
      saveToStorage(resultData)
    }
    
    return parentId
  },

  completeParentMarriage: (marriageId: string, secondParentId: string) => {
    const state = get()
    
    // Validate marriage exists and is incomplete
    const marriage = state.data.marriages.find(m => m.id === marriageId)
    if (!marriage) {
      throw new Error('Marriage not found')
    }
    
    const isIncomplete = !marriage.husbandId || !marriage.wifeId
    if (!isIncomplete) {
      throw new Error('Marriage is already complete')
    }
    
    // Validate second parent exists
    if (!state.indices.personById.has(secondParentId)) {
      throw new Error('Second parent not found')
    }
    
    const secondParent = state.indices.personById.get(secondParentId)!
    
    // Determine which slot to fill based on gender
    const resultData = validateAndCommit(
      state.data,
      (data) => ({
        ...data,
        marriages: data.marriages.map(m => {
          if (m.id === marriageId) {
            if (!m.husbandId && secondParent.gender === 'M') {
              return { ...m, husbandId: secondParentId }
            } else if (!m.wifeId && secondParent.gender === 'F') {
              return { ...m, wifeId: secondParentId }
            } else {
              throw new Error('Gender mismatch for marriage completion')
            }
          }
          return m
        })
      }),
      (warnings) => console.warn('Marriage completion warnings:', warnings)
    )
    
    set({ data: resultData, indices: buildIndices(resultData) })
    saveToStorage(resultData)
  },

  deletePerson: (options: { personId: string, forceOrphan?: boolean, forceRootDelete?: boolean }) => {
    const state = get()
    
    const { personId, forceOrphan = false, forceRootDelete = false } = options
    
    // Check if person exists
    if (!state.indices.personById.has(personId)) {
      throw new Error('Person not found')
    }
    
    const person = state.indices.personById.get(personId)!
    
    // Check if this is the root person
    if (person.isRoot && !forceRootDelete) {
      throw new Error('Cannot delete root person without forceRootDelete flag')
    }
    
    // Calculate deletion impact
    const impact = calculateDeletionImpact(personId, state.data)
    
    // Check if we can delete (last person check)
    const { canDelete, reason } = canDeletePerson(personId, state.data)
    if (!canDelete) {
      throw new Error(reason || 'Cannot delete person')
    }
    
    // Check for orphaned children
    if (impact.orphanedChildren.length > 0 && !forceOrphan) {
      throw new Error(`Cannot delete person: would orphan ${impact.orphanedChildren.length} children. Use forceOrphan flag to proceed.`)
    }
    
    // If this would be the last person, clear everything
    if (state.data.persons.length === 1) {
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
    
    // Perform deletion with validation
    const resultData = validateAndCommit(
      state.data,
      (data) => {
        // Remove person
        const persons = data.persons.filter(p => p.id !== personId)
        
        // Update marriage statuses based on forceOrphan flag
        const marriages = data.marriages.map(marriage => {
          if (marriage.husbandId === personId || marriage.wifeId === personId) {
            // Check if this marriage has children
            const hasChildren = data.children.some(c => c.marriageId === marriage.id)
            if (hasChildren && forceOrphan) {
              return { ...marriage, status: 'terminated' as MarriageStatus }
            } else if (!hasChildren) {
              return { ...marriage, status: 'terminated' as MarriageStatus }
            }
            // If has children and not forceOrphan, this should have been caught earlier
            return marriage
          }
          return marriage
        })
        
        // Remove child links if not forceOrphan
        const children = forceOrphan 
          ? data.children 
          : data.children.filter(c => 
              !impact.marriagesToDelete.some(m => m.id === c.marriageId)
            )
        
        return {
          ...data,
          persons,
          marriages,
          children
        }
      },
      (warnings: ValidationWarnings) => {
        console.warn('Data quality warnings:', warnings)
        if (warnings.orphanedChildren.length > 0) {
          console.warn(`${warnings.orphanedChildren.length} children promoted to root`)
        }
      }
    )
    
    // Clear selection if deleted person was selected
    const newSelectedPersonId = state.selectedPersonId === personId ? null : state.selectedPersonId
    const newSelectedMarriageId = impact.marriagesToDelete.some(m => m.id === state.selectedMarriageId) 
      ? null 
      : state.selectedMarriageId
    
    set({
      data: resultData,
      indices: buildIndices(resultData),
      selectedPersonId: newSelectedPersonId,
      selectedMarriageId: newSelectedMarriageId
    })
    
    // Auto-save
    saveToStorage(resultData)
    
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

      const resultData = validateAndCommit(
        state.data,
        (data) => ({
          ...data,
          persons: data.persons.map(p => 
            p.id === personId ? { ...p, name: newName.trim() } : p
          )
        }),
        (warnings: ValidationWarnings) => {
          console.warn('Data quality warnings:', warnings)
        }
      )

      set({
        data: resultData,
        indices: buildIndices(resultData)
      })

      saveToStorage(resultData)
    },

    updatePersonGender: (personId: string, newGender: Gender) => {
      const state = get()

      if (!state.indices.personById.has(personId)) {
        throw new Error('Person not found')
      }

      const resultData = validateAndCommit(
        state.data,
        (data) => ({
          ...state.data,
          persons: data.persons.map(p => 
            p.id === personId ? { ...p, gender: newGender } : p
          )
        }),
        (warnings: ValidationWarnings) => {
          console.warn('Data quality warnings:', warnings)
        }
      )

      set({
        data: resultData,
        indices: buildIndices(resultData)
      })

      saveToStorage(resultData)
    },

    updateMarriageDates: (marriageId: string, marriageDate: string | null, divorceDate: string | null) => {
      const state = get()

      if (!state.data.marriages.some(m => m.id === marriageId)) {
        throw new Error('Marriage not found')
      }

      const resultData = validateAndCommit(
        state.data,
        (data) => ({
          ...data,
          marriages: data.marriages.map(m => 
            m.id === marriageId ? { ...m, marriageDate, divorceDate } : m
          )
        }),
        (warnings: ValidationWarnings) => {
          console.warn('Data quality warnings:', warnings)
        }
      )

      set({
        data: resultData,
        indices: buildIndices(resultData)
      })

      saveToStorage(resultData)
    },
  
  // Internal helpers
  rebuildIndices: () => {
    const state = get()
    set({ indices: buildIndices(state.data) })
  }
}))

export { useFamilyTreeStore }
export default useFamilyTreeStore
