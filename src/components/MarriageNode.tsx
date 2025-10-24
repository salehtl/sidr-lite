import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { Baby, Heart, X, Trash2 } from 'lucide-react'
import type { Marriage, MarriageStatus, Gender } from '../types/domain'

interface MarriageNodeProps {
  data: {
    marriage: Marriage
    validationStatus?: 'valid' | 'warning' | 'error'
    errors?: string[]
  }
}

export default function MarriageNode({ data }: MarriageNodeProps) {
  const { marriage, validationStatus = 'valid', errors = [] } = data
  const [showActions, setShowActions] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const { 
    data: familyData, 
    selectMarriage, 
    addChild, 
    setMarriageStatus,
    deletePerson 
  } = useFamilyTreeStore()
  
  const getStatusColor = (status: string) => {
    const baseColors = {
      'active': 'bg-gradient-to-br from-green-100 to-green-200',
      'divorced': 'bg-gradient-to-br from-red-100 to-red-200',
      'widowed': 'bg-gradient-to-br from-gray-100 to-gray-200'
    }
    
    const borderColors = {
      'active': 'border-green-400',
      'divorced': 'border-red-400',
      'widowed': 'border-gray-400'
    }
    
    const validationColors = {
      'error': 'border-red-500 shadow-red-200',
      'warning': 'border-yellow-500 shadow-yellow-200',
      'valid': ''
    }
    
    return `${baseColors[status as keyof typeof baseColors]} ${borderColors[status as keyof typeof borderColors]} ${validationColors[validationStatus]}`
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Heart size={12} className="text-green-600" />
      case 'divorced': return <X size={12} className="text-red-600" />
      case 'widowed': return <div className="w-2 h-2 bg-gray-600 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-600 rounded-full" />
    }
  }
  
  const getChildCount = () => {
    return familyData.children.filter(child => child.marriageId === marriage.id).length
  }
  
  const handleAddChild = () => {
    const childName = prompt('Enter child name:')
    if (childName) {
      const childGender = prompt('Enter child gender (M/F/U):') as Gender
      if (childGender && ['M', 'F', 'U'].includes(childGender)) {
        try {
          addChild(marriage.id, childName, childGender)
        } catch (error) {
          alert(`Cannot add child: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  }
  
  const handleStatusChange = (newStatus: MarriageStatus) => {
    try {
      setMarriageStatus(marriage.id, newStatus)
      setShowStatusMenu(false)
    } catch (error) {
      alert(`Cannot change status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleDeleteMarriage = () => {
    if (confirm('Delete this marriage? This will also delete all children of this marriage.')) {
      // Find the husband and wife
      const husband = familyData.persons.find(p => p.id === marriage.husbandId)
      const wife = familyData.persons.find(p => p.id === marriage.wifeId)
      
      if (husband && wife) {
        // Delete one of the spouses (this will cascade delete the marriage)
        try {
          deletePerson(husband.id, false)
        } catch (error) {
          alert(`Cannot delete marriage: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  }
  
  const childCount = getChildCount()
  
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
      className={`relative w-10 h-10 border-2 rounded-full shadow-sm transition-all duration-200 ${getStatusColor(marriage.status)} flex items-center justify-center ${
        showActions ? 'shadow-lg scale-110' : 'hover:shadow-md'
      } ${
        validationStatus === 'error' ? 'animate-pulse' : 
        validationStatus === 'warning' ? 'animate-bounce' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => selectMarriage(marriage.id)}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="flex items-center justify-center">
        {getStatusIcon(marriage.status)}
      </div>
      
      {/* Child Count Badge */}
      {childCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {childCount}
        </div>
      )}
      
      {/* Validation Error Badge */}
      {validationStatus === 'error' && (
        <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          !
        </div>
      )}
      
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
            <button
              onClick={handleAddChild}
              className="p-2 text-green-600 hover:bg-green-100 rounded"
              title="Add Child"
            >
              <Baby size={16} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                title="Change Status"
              >
                <Heart size={16} />
              </button>
              
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-1 z-20">
                  <button
                    onClick={() => handleStatusChange('active')}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-green-100 ${
                      marriage.status === 'active' ? 'bg-green-100' : ''
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusChange('divorced')}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-red-100 ${
                      marriage.status === 'divorced' ? 'bg-red-100' : ''
                    }`}
                  >
                    Divorced
                  </button>
                  <button
                    onClick={() => handleStatusChange('widowed')}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                      marriage.status === 'widowed' ? 'bg-gray-100' : ''
                    }`}
                  >
                    Widowed
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleDeleteMarriage}
              className="p-2 text-red-600 hover:bg-red-100 rounded"
              title="Delete Marriage"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
