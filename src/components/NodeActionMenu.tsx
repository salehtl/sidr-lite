import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { preValidatePersonCreation } from '../utils/preValidationHelpers'
import { 
  UserPlus, 
  Baby, 
  Users, 
  UserCheck, 
  Trash2, 
  Heart, 
  AlertTriangle 
} from 'lucide-react'
import type { Person, Marriage, Gender, MarriageStatus } from '../types/domain'

interface NodeActionMenuProps {
  nodeType: 'person' | 'marriage'
  nodeData: Person | Marriage
  onClose: () => void
  position: { x: number, y: number }
}

export default function NodeActionMenu({ nodeType, nodeData, onClose, position }: NodeActionMenuProps) {
  const [showValidation, setShowValidation] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  
  const { 
    data: familyData, 
    createPerson, 
    createMarriage, 
    addChild, 
    addSibling, 
    addParent,
    setMarriageStatus,
    deletePerson 
  } = useFamilyTreeStore()
  
  const handleAddSpouse = async () => {
    const spouseName = prompt('Enter spouse name:')
    if (!spouseName) return
    
    const spouseGender = prompt('Enter spouse gender (M/F/U):') as Gender
    if (!spouseGender || !['M', 'F'].includes(spouseGender)) {
      alert('Invalid gender. Please enter M, F, or U.')
      return
    }
    
    // Pre-validate
    const validation = preValidatePersonCreation(
      spouseName, 
      spouseGender, 
      'spouse', 
      (nodeData as Person).id, 
      familyData
    )
    
    if (!validation.isValid) {
      setValidationMessage(validation.errors.join(', '))
      setShowValidation(true)
      return
    }
    
    try {
      const spouseId = createPerson(spouseName, spouseGender)
      createMarriage((nodeData as Person).id, spouseId)
      onClose()
    } catch (error) {
      alert(`Cannot add spouse: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddChild = async () => {
    const childName = prompt('Enter child name:')
    if (!childName) return
    
    const childGender = prompt('Enter child gender (M/F/U):') as Gender
    if (!childGender || !['M', 'F'].includes(childGender)) {
      alert('Invalid gender. Please enter M, F, or U.')
      return
    }
    
    try {
      if (nodeType === 'person') {
        const person = nodeData as Person
        const marriage = familyData.marriages.find(m => 
          m.husbandId === person.id || m.wifeId === person.id
        )
        if (marriage) {
          addChild(marriage.id, childName, childGender)
        } else {
          alert('Person must be married to add children')
          return
        }
      } else if (nodeType === 'marriage') {
        const marriage = nodeData as Marriage
        addChild(marriage.id, childName, childGender)
      }
      onClose()
    } catch (error) {
      alert(`Cannot add child: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddSibling = async () => {
    const siblingName = prompt('Enter sibling name:')
    if (!siblingName) return
    
    const siblingGender = prompt('Enter sibling gender (M/F/U):') as Gender
    if (!siblingGender || !['M', 'F'].includes(siblingGender)) {
      alert('Invalid gender. Please enter M, F, or U.')
      return
    }
    
    // Pre-validate
    const validation = preValidatePersonCreation(
      siblingName, 
      siblingGender, 
      'sibling', 
      (nodeData as Person).id, 
      familyData
    )
    
    if (!validation.isValid) {
      setValidationMessage(validation.errors.join(', '))
      setShowValidation(true)
      return
    }
    
    try {
      addSibling((nodeData as Person).id, siblingName, siblingGender)
      onClose()
    } catch (error) {
      alert(`Cannot add sibling: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddParent = async () => {
    const parentName = prompt('Enter parent name:')
    if (!parentName) return
    
    const parentGender = prompt('Enter parent gender (M/F):') as Gender
    if (!parentGender || !['M', 'F'].includes(parentGender)) {
      alert('Invalid gender. Please enter M or F.')
      return
    }
    
    // Pre-validate
    const validation = preValidatePersonCreation(
      parentName, 
      parentGender, 
      'parent', 
      (nodeData as Person).id, 
      familyData
    )
    
    if (!validation.isValid) {
      setValidationMessage(validation.errors.join(', '))
      setShowValidation(true)
      return
    }
    
    try {
      addParent((nodeData as Person).id, parentName, parentGender)
      onClose()
    } catch (error) {
      alert(`Cannot add parent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleStatusChange = (newStatus: MarriageStatus) => {
    try {
      setMarriageStatus((nodeData as Marriage).id, newStatus)
      onClose()
    } catch (error) {
      alert(`Cannot change status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleDelete = () => {
    if (nodeType === 'person') {
      const person = nodeData as Person
      if (confirm(`Delete ${person.name}? This will also delete all their relationships.`)) {
        try {
          deletePerson({ personId: person.id })
          onClose()
        } catch (error) {
          alert(`Cannot delete person: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } else {
      const marriage = nodeData as Marriage
      if (confirm('Delete this marriage? This will also delete all children of this marriage.')) {
        const husband = familyData.persons.find(p => p.id === marriage.husbandId)
        if (husband) {
          try {
            deletePerson({ personId: husband.id })
            onClose()
          } catch (error) {
            alert(`Cannot delete marriage: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    }
  }
  
  // Check what actions are available
  const getAvailableActions = () => {
    if (nodeType === 'person') {
      const person = nodeData as Person
      const canAddSpouse = familyData.marriages.filter(m => 
        m.husbandId === person.id || m.wifeId === person.id
      ).length < (person.gender === 'M' ? 4 : 1)
      
      const canAddChild = familyData.marriages.some(m => 
        m.husbandId === person.id || m.wifeId === person.id
      )
      
      const canAddSibling = familyData.children.some(c => c.childId === person.id)
      
      const canAddParent = familyData.children.filter(c => c.childId === person.id).length < 2
      
      return { canAddSpouse, canAddChild, canAddSibling, canAddParent }
    }
    return { canAddSpouse: false, canAddChild: true, canAddSibling: false, canAddParent: false }
  }
  
  const actions = getAvailableActions()
  
  return (
    <div 
      className="fixed bg-white rounded-lg shadow-lg border p-2 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {showValidation && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{validationMessage}</span>
          <button 
            onClick={() => setShowValidation(false)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex gap-1">
        {nodeType === 'person' && actions.canAddSpouse && (
          <button
            onClick={handleAddSpouse}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
            title="Add Spouse"
          >
            <UserPlus size={16} />
          </button>
        )}
        
        {actions.canAddChild && (
          <button
            onClick={handleAddChild}
            className="p-2 text-green-600 hover:bg-green-100 rounded"
            title="Add Child"
          >
            <Baby size={16} />
          </button>
        )}
        
        {nodeType === 'person' && actions.canAddSibling && (
          <button
            onClick={handleAddSibling}
            className="p-2 text-purple-600 hover:bg-purple-100 rounded"
            title="Add Sibling"
          >
            <Users size={16} />
          </button>
        )}
        
        {nodeType === 'person' && actions.canAddParent && (
          <button
            onClick={handleAddParent}
            className="p-2 text-orange-600 hover:bg-orange-100 rounded"
            title="Add Parent"
          >
            <UserCheck size={16} />
          </button>
        )}
        
        {nodeType === 'marriage' && (
          <div className="relative">
            <button
              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
              title="Change Status"
            >
              <Heart size={16} />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-1 z-20">
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-green-100"
              >
                Active
              </button>
              <button
                onClick={() => handleStatusChange('divorced')}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-red-100"
              >
                Divorced
              </button>
              <button
                onClick={() => handleStatusChange('widowed')}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100"
              >
                Widowed
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={handleDelete}
          className="p-2 text-red-600 hover:bg-red-100 rounded"
          title={`Delete ${nodeType}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
