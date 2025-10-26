import React, { useState, useEffect, useRef } from 'react'
import { getSuggestions, addLearnedName, getCulturalSuggestions } from '../utils/nameDatabase'
import { ChevronDown, X } from 'lucide-react'
import type { Gender } from '../types/domain'

interface NameAutocompleteProps {
  value: string
  onChange: (value: string) => void
  gender?: Gender
  placeholder?: string
  className?: string
  onBlur?: () => void
  onFocus?: () => void
  existingNames?: string[]
}

export default function NameAutocomplete({
  value,
  onChange,
  gender,
  placeholder = "Enter name",
  className = "",
  onBlur,
  onFocus,
  existingNames = []
}: NameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [culturalSuggestions, setCulturalSuggestions] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Update suggestions when value changes
  useEffect(() => {
    if (value.trim().length >= 1) {
      const nameSuggestions = getSuggestions(value, gender, 8)
      setSuggestions(nameSuggestions.map(s => s.name))
      
      // Get cultural suggestions if we have existing names
      if (existingNames.length > 0) {
        const cultural = getCulturalSuggestions(existingNames, 3)
        setCulturalSuggestions(cultural.map(s => s.name))
      }
    } else {
      setSuggestions([])
      setCulturalSuggestions([])
    }
  }, [value, gender, existingNames])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
    setShowSuggestions(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        return
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
      onBlur?.()
    }, 150)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
    onFocus?.()
  }

  const clearInput = () => {
    onChange('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const allSuggestions = [
    ...(culturalSuggestions.length > 0 ? culturalSuggestions : []),
    ...suggestions
  ].slice(0, 8)

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Dropdown indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && allSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Cultural suggestions section */}
          {culturalSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Similar to your family
              </div>
              {culturalSuggestions.map((suggestion, index) => (
                <button
                  key={`cultural-${suggestion}`}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                    selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  {suggestion}
                </button>
              ))}
              {suggestions.length > 0 && (
                <div className="border-t border-gray-100"></div>
              )}
            </>
          )}
          
          {/* Regular suggestions */}
          {suggestions.map((suggestion, index) => {
            const adjustedIndex = culturalSuggestions.length + index
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                  selectedIndex === adjustedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {suggestion}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Hook for learning names when they're successfully added
export function useNameLearning() {
  const learnName = (name: string, gender: Gender) => {
    addLearnedName(name, gender)
  }

  return { learnName }
}
