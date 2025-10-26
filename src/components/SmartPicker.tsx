import { useState, useRef, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { getEligibleSpouses } from '../utils/relationshipHelpers'
import { Search, User, Heart, ChevronDown, Users, Baby, UserCheck, X, Check } from 'lucide-react'
import type { RelationshipType } from '../types/domain'

interface SmartPickerProps {
  type: 'person' | 'marriage'
  onSelect: (id: string) => void
  selectedId: string | null
  placeholder?: string
  disabled?: boolean
  relationshipType?: RelationshipType
  targetPersonId?: string
}

export default function SmartPicker({ 
  type, 
  onSelect, 
  selectedId, 
  placeholder = "Search or select...",
  disabled = false,
  relationshipType,
  targetPersonId
}: SmartPickerProps) {
  const { data } = useFamilyTreeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  
  // Get options based on type with filtering
  const getOptions = () => {
    if (type === 'person') {
      let persons = data.persons
      
      // Apply relationship-based filtering
      if (relationshipType === 'spouse' && targetPersonId) {
        const targetPerson = data.persons.find(p => p.id === targetPersonId)
        if (targetPerson) {
          persons = getEligibleSpouses(data.persons, targetPerson)
        }
      }
      
      return persons.map(person => ({
        id: person.id,
        label: person.name,
        subtitle: `${person.gender === 'M' ? 'Male' : 'Female'}${person.isRoot ? ' • Root' : ''}`,
        icon: person.gender === 'M' ? '♂' : '♀',
        gender: person.gender,
        isRoot: person.isRoot
      }))
    } else {
      return data.marriages.map(marriage => {
        const husband = data.persons.find(p => p.id === marriage.husbandId)
        const wife = data.persons.find(p => p.id === marriage.wifeId)
        const children = data.children.filter(c => c.marriageId === marriage.id)
        
        return {
          id: marriage.id,
          label: `${husband?.name || 'Unknown'} & ${wife?.name || 'Unknown'}`,
          subtitle: `${children.length} child${children.length !== 1 ? 'ren' : ''} • ${marriage.status}`,
          icon: '💑',
          status: marriage.status,
          childCount: children.length
        }
      })
    }
  }
  
  const options = getOptions()
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const searchLower = searchTerm.toLowerCase()
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.subtitle.toLowerCase().includes(searchLower) ||
      (option as any).gender?.toLowerCase().includes(searchLower) ||
      (option as any).status?.toLowerCase().includes(searchLower)
    )
  })
  
  const selectedOption = options.find(opt => opt.id === selectedId)
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          onSelect(filteredOptions[highlightedIndex].id)
          setIsOpen(false)
          setSearchTerm('')
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }
  
  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchTerm])
  
  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])
  
  const handleSelect = (id: string) => {
    onSelect(id)
    setIsOpen(false)
    setSearchTerm('')
    inputRef.current?.blur()
  }

  const getRelationshipIcon = () => {
    switch (relationshipType) {
      case 'spouse': return Heart
      case 'child': return Baby
      case 'parent': return UserCheck
      case 'sibling': return Users
      default: return User
    }
  }

  const RelationshipIcon = getRelationshipIcon()
  
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        >
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RelationshipIcon size={16} />
                  <span>
                    {relationshipType === 'spouse' && 'Select person to marry'}
                    {relationshipType === 'child' && 'Select marriage to add child to'}
                    {relationshipType === 'parent' && 'Select person to add parent to'}
                    {relationshipType === 'sibling' && 'Select person to add sibling to'}
                    {!relationshipType && 'Select target'}
                  </span>
                </div>
              </div>
              <div ref={listRef}>
                {filteredOptions.map((option, index) => {
                  const isHighlighted = index === highlightedIndex
                  const isSelected = selectedId === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 ${
                        isHighlighted 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50'
                      } ${isSelected ? 'bg-blue-100' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-lg">{option.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{option.subtitle}</div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <Check size={16} className="text-blue-600" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-gray-400 mb-2">
                <Search size={24} />
              </div>
              <div className="text-gray-500 text-sm">No options found</div>
              <div className="text-xs text-gray-400 mt-1">
                Try adjusting your search terms
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}