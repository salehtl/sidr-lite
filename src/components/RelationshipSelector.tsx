import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { User, Heart, Baby, UserCheck, Users, ChevronDown, Info } from 'lucide-react'
import type { RelationshipType } from '../types/domain'

interface RelationshipSelectorProps {
  name: string
  onRelationshipChange: (type: RelationshipType, targetId?: string) => void
  selectedType: RelationshipType | null
  selectedTargetId: string | null
}

export default function RelationshipSelector({
  name,
  onRelationshipChange,
  selectedType,
  selectedTargetId
}: RelationshipSelectorProps) {
  const { data } = useFamilyTreeStore()
  const [isOpen, setIsOpen] = useState(false)
  
  const relationshipOptions = [
    { 
      type: 'root' as const, 
      label: 'New person (root)', 
      icon: User,
      description: 'Start a new family tree',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      disabled: false
    },
    { 
      type: 'spouse' as const, 
      label: 'Add spouse to...', 
      icon: Heart,
      description: 'Marry to an existing person',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      disabled: data.persons.length === 0
    },
    { 
      type: 'child' as const, 
      label: 'Add child to marriage...', 
      icon: Baby,
      description: 'Child of a specific marriage',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      disabled: data.marriages.length === 0
    },
    { 
      type: 'parent' as const, 
      label: 'Add parent of...', 
      icon: UserCheck,
      description: 'Parent of an existing person',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      disabled: data.persons.length === 0
    },
    { 
      type: 'sibling' as const, 
      label: 'Add sibling of...', 
      icon: Users,
      description: 'Brother or sister of existing person',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      disabled: data.persons.length === 0
    }
  ]
  
  const selectedOption = relationshipOptions.find(opt => opt.type === selectedType)
  
  const getPreviewText = () => {
    if (!selectedType || !name.trim()) return ''
    
    switch (selectedType) {
      case 'root':
        return `Adding ${name} as the root person`
      case 'spouse': {
        const person = data.persons.find(p => p.id === selectedTargetId)
        return `Adding ${name} as spouse of ${person?.name || '...'}`
      }
      case 'child': {
        const marriage = data.marriages.find(m => m.id === selectedTargetId)
        if (!marriage) return `Adding ${name} as child of marriage...`
        const husband = data.persons.find(p => p.id === marriage.husbandId)
        const wife = data.persons.find(p => p.id === marriage.wifeId)
        return `Adding ${name} as child of ${husband?.name || '...'} and ${wife?.name || '...'}`
      }
      case 'parent': {
        const person = data.persons.find(p => p.id === selectedTargetId)
        return `Adding ${name} as parent of ${person?.name || '...'}`
      }
      case 'sibling': {
        const person = data.persons.find(p => p.id === selectedTargetId)
        return `Adding ${name} as sibling of ${person?.name || '...'}`
      }
      default:
        return ''
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Relationship Type
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between transition-all duration-200 ${
              selectedOption 
                ? `${selectedOption.borderColor} ${selectedOption.bgColor}` 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span className="flex items-center gap-3">
              {selectedOption ? (
                <>
                  <selectedOption.icon size={20} className={selectedOption.color} />
                  <div>
                    <div className="font-medium text-gray-900">{selectedOption.label}</div>
                    <div className="text-xs text-gray-500">{selectedOption.description}</div>
                  </div>
                </>
              ) : (
                <span className="text-gray-500">Select relationship type...</span>
              )}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isOpen && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {relationshipOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      onRelationshipChange(option.type)
                      setIsOpen(false)
                    }}
                    disabled={option.disabled}
                    className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 ${
                      option.disabled 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                        : 'text-gray-900 hover:bg-gray-50'
                    } ${selectedType === option.type ? `${option.bgColor} ${option.borderColor} border-l-4` : ''}`}
                  >
                    <IconComponent size={20} className={option.disabled ? 'text-gray-400' : option.color} />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      {option.disabled && (
                        <div className="text-xs text-red-500 mt-1">
                          {option.type === 'spouse' || option.type === 'parent' || option.type === 'sibling' 
                            ? 'No persons available' 
                            : 'No marriages available'}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Preview */}
      {selectedType && name.trim() && (
        <div className={`p-4 rounded-lg border ${selectedOption?.bgColor} ${selectedOption?.borderColor}`}>
          <div className="flex items-start gap-3">
            <Info size={16} className={`mt-0.5 ${selectedOption?.color}`} />
            <div>
              <div className={`text-sm font-medium ${selectedOption?.color}`}>
                {getPreviewText()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {selectedType === 'root' && 'This person will be the starting point of your family tree.'}
                {selectedType === 'spouse' && 'This will create a marriage between the two people.'}
                {selectedType === 'child' && 'This person will be added as a child to the selected marriage.'}
                {selectedType === 'parent' && 'This person will be added as a parent to the selected person.'}
                {selectedType === 'sibling' && 'This person will be added as a sibling to the selected person.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
