import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { Edit, Trash2, UserPlus, Baby, Users, UserCheck } from 'lucide-react'
import AddPersonModal from './modals/AddPersonModal'
import ConfirmDialog from './modals/ConfirmDialog'
import type { Person, Gender } from '../types/domain'

interface PersonNodeProps {
  data: {
    person: Person
    validationStatus?: 'valid' | 'warning' | 'error'
    errors?: string[]
  }
}

export default function PersonNode({ data }: PersonNodeProps) {
  const { person, validationStatus = 'valid', errors = [] } = data
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showAddSpouseModal, setShowAddSpouseModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showAddSiblingModal, setShowAddSiblingModal] = useState(false)
  const [showAddParentModal, setShowAddParentModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const { 
    data: familyData, 
    selectPerson, 
    createPerson, 
    createMarriage, 
    addChild, 
    addSibling, 
    addParent,
    deletePerson,
    updatePersonName,
    updatePersonGender
  } = useFamilyTreeStore()
  
  const getGenderColor = (gender: string) => {
    const baseColors = {
      'M': 'bg-gradient-to-br from-blue-100 to-blue-200',
      'F': 'bg-gradient-to-br from-pink-100 to-pink-200',
      'U': 'bg-gradient-to-br from-gray-100 to-gray-200'
    }
    
    const borderColors = {
      'M': 'border-blue-400',
      'F': 'border-pink-400', 
      'U': 'border-gray-400'
    }
    
    const validationColors = {
      'error': 'border-red-500 shadow-red-200',
      'warning': 'border-yellow-500 shadow-yellow-200',
      'valid': ''
    }
    
    return `${baseColors[gender as keyof typeof baseColors]} ${borderColors[gender as keyof typeof borderColors]} ${validationColors[validationStatus]}`
  }
  
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M': return '♂'
      case 'F': return '♀'
      default: return '?'
    }
  }
  
  const handleGenderToggle = () => {
    const nextGender: Gender = person.gender === 'M' ? 'F' : person.gender === 'F' ? 'U' : 'M'
    try {
      updatePersonGender(person.id, nextGender)
    } catch (error) {
      alert(`Cannot update gender: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddSpouse = () => {
    setShowAddSpouseModal(true)
  }

  const handleConfirmAddSpouse = (spouseName: string, spouseGender: Gender) => {
    try {
      const spouseId = createPerson(spouseName, spouseGender)
      createMarriage(person.id, spouseId)
    } catch (error) {
      alert(`Cannot add spouse: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddChild = () => {
    setShowAddChildModal(true)
  }

  const handleConfirmAddChild = (childName: string, childGender: Gender) => {
    // Find a marriage for this person
    const marriage = familyData.marriages.find(m => 
      m.husbandId === person.id || m.wifeId === person.id
    )
    if (marriage) {
      try {
        addChild(marriage.id, childName, childGender)
      } catch (error) {
        alert(`Cannot add child: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      alert('Person must be married to add children')
    }
  }
  
  const handleAddSibling = () => {
    setShowAddSiblingModal(true)
  }

  const handleConfirmAddSibling = (siblingName: string, siblingGender: Gender) => {
    try {
      addSibling(person.id, siblingName, siblingGender)
    } catch (error) {
      alert(`Cannot add sibling: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleAddParent = () => {
    setShowAddParentModal(true)
  }

  const handleConfirmAddParent = (parentName: string, parentGender: Gender) => {
    try {
      addParent(person.id, parentName, parentGender)
    } catch (error) {
      alert(`Cannot add parent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    try {
      deletePerson(person.id, false)
    } catch (error) {
      alert(`Cannot delete person: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleSaveEdit = () => {
    if (editName.trim() && editName !== person.name) {
      try {
        updatePersonName(person.id, editName.trim())
      } catch (error) {
        alert(`Cannot update name: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setEditName(person.name) // Reset to original name on error
      }
    }
    setIsEditing(false)
  }
  
  const handleCancelEdit = () => {
    setEditName(person.name)
    setIsEditing(false)
  }
  
  // Check what actions are available
  const canAddSpouse = familyData.marriages.filter(m => 
    m.husbandId === person.id || m.wifeId === person.id
  ).length < (person.gender === 'M' ? 4 : 1)
  
  const canAddChild = familyData.marriages.some(m => 
    m.husbandId === person.id || m.wifeId === person.id
  )
  
  const canAddSibling = familyData.children.some(c => c.childId === person.id)
  
  const canAddParent = familyData.children.filter(c => c.childId === person.id).length < 2
  
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setShowActions(true)
  }
  
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowActions(false)
    }, 150) // Small delay to allow moving to menu
    setHoverTimeout(timeout)
  }
  
  const handleMenuMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }
  
  const handleMenuMouseLeave = () => {
    setShowActions(false)
  }
  
  return (
    <div 
      className={`relative px-4 py-2 border-2 rounded-lg shadow-sm transition-all duration-200 ${getGenderColor(person.gender)} ${
        showActions ? 'shadow-lg scale-105' : 'hover:shadow-md'
      } ${
        validationStatus === 'error' ? 'animate-pulse' : 
        validationStatus === 'warning' ? 'animate-bounce' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => selectPerson(person.id)}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="text-center">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none text-center w-full"
            autoFocus
          />
        ) : (
          <div 
            className="text-lg font-bold text-gray-900 cursor-pointer"
            onDoubleClick={() => setIsEditing(true)}
          >
            {person.name}
          </div>
        )}
        
        <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
          <span 
            className="cursor-pointer hover:bg-gray-300 rounded px-1"
            onClick={handleGenderToggle}
            title="Click to change gender"
          >
            {getGenderIcon(person.gender)}
          </span>
          {person.isRoot && <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">ROOT</span>}
          {validationStatus === 'error' && (
            <span className="text-xs bg-red-200 text-red-800 px-1 rounded flex items-center gap-1">
              ⚠️ {errors.length}
            </span>
          )}
          {validationStatus === 'warning' && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
              ⚠️
            </span>
          )}
        </div>
      </div>
      
      {/* Validation Error Tooltip */}
      {showActions && errors.length > 0 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-100 border border-red-300 rounded-lg p-2 z-20 max-w-xs">
          <div className="text-xs text-red-700">
            <div className="font-medium mb-1">Validation Errors:</div>
            <ul className="space-y-1">
              {errors.slice(0, 3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {errors.length > 3 && (
                <li>• ... and {errors.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {/* Action Menu */}
      {showActions && (
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border p-2 z-10"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="flex gap-1">
            {canAddSpouse && (
              <button
                onClick={handleAddSpouse}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                title="Add Spouse"
              >
                <UserPlus size={16} />
              </button>
            )}
            
            {canAddChild && (
              <button
                onClick={handleAddChild}
                className="p-2 text-green-600 hover:bg-green-100 rounded"
                title="Add Child"
              >
                <Baby size={16} />
              </button>
            )}
            
            {canAddSibling && (
              <button
                onClick={handleAddSibling}
                className="p-2 text-purple-600 hover:bg-purple-100 rounded"
                title="Add Sibling"
              >
                <Users size={16} />
              </button>
            )}
            
            {canAddParent && (
              <button
                onClick={handleAddParent}
                className="p-2 text-orange-600 hover:bg-orange-100 rounded"
                title="Add Parent"
              >
                <UserCheck size={16} />
              </button>
            )}
            
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Edit Name"
            >
              <Edit size={16} />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-100 rounded"
              title="Delete Person"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPersonModal
        isOpen={showAddSpouseModal}
        onClose={() => setShowAddSpouseModal(false)}
        onConfirm={handleConfirmAddSpouse}
        title="Add Spouse"
        placeholder="Enter spouse name"
      />

      <AddPersonModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onConfirm={handleConfirmAddChild}
        title="Add Child"
        placeholder="Enter child name"
      />

      <AddPersonModal
        isOpen={showAddSiblingModal}
        onClose={() => setShowAddSiblingModal(false)}
        onConfirm={handleConfirmAddSibling}
        title="Add Sibling"
        placeholder="Enter sibling name"
      />

      <AddPersonModal
        isOpen={showAddParentModal}
        onClose={() => setShowAddParentModal(false)}
        onConfirm={handleConfirmAddParent}
        title="Add Parent"
        placeholder="Enter parent name"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Person"
        message={`Delete ${person.name}? This will also delete all their relationships.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
