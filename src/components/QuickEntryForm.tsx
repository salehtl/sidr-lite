import React, { useState, useRef } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { useKeyboardNav, createShortcuts } from '../hooks/useKeyboardNav'
import { ValidationError } from '../store/validators'
import { preValidatePersonCreation } from '../utils/preValidationHelpers'
import { Check, X } from 'lucide-react'
import type { Gender, RelationshipType } from '../types/domain'
import RelationshipSelector from './RelationshipSelector'
import SmartPicker from './SmartPicker'

export default function QuickEntryForm() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('U')
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const targetPickerRef = useRef<HTMLDivElement>(null)
  const genderSelectRef = useRef<HTMLSelectElement>(null)
  
  const {
    createPerson,
    createMarriage,
    addChild,
    addSibling,
    addParent,
    selectPerson,
    selectMarriage,
    data,
    prefilledForm,
    setPrefilledForm
  } = useFamilyTreeStore()
  
  // Keyboard shortcuts
  const shortcuts = createShortcuts({
    addSpouse: () => setRelationshipType('spouse'),
    addChild: () => setRelationshipType('child'),
    addParent: () => setRelationshipType('parent'),
    addSibling: () => setRelationshipType('sibling'),
    submit: handleSubmit,
    clear: clearForm,
    focusSearch: () => nameInputRef.current?.focus()
  })
  
  useKeyboardNav({ shortcuts })
  
  function clearForm() {
    setName('')
    setGender('U')
    setRelationshipType(null)
    setSelectedTargetId(null)
    setError(null)
    setSuccess(null)
    nameInputRef.current?.focus()
  }
  
  async function handleSubmit() {
    setError(null)
    setSuccess(null)
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    // PRE-VALIDATION: Check if the operation will be valid before creating anything
    const preValidation = preValidatePersonCreation(name, gender, relationshipType, selectedTargetId, data)
    
    if (!preValidation.isValid) {
      setError(preValidation.errors.join(', '))
      return
    }
    
    // Show warnings if any
    if (preValidation.warnings.length > 0) {
      console.warn('Pre-validation warnings:', preValidation.warnings)
    }
    
    try {
      let personId: string
      let message: string
      
      switch (relationshipType) {
        case 'root':
          personId = createPerson(name, gender)
          selectPerson(personId)
          message = 'Root person created! You can now add spouses and children.'
          break
          
        case 'spouse':
          if (!selectedTargetId) {
            setError('Please select a person to marry')
            return
          }
          personId = createPerson(name, gender)
          const marriageId = createMarriage(selectedTargetId, personId)
          selectMarriage(marriageId)
          message = 'Spouse added and marriage created!'
          break
          
        case 'child':
          if (!selectedTargetId) {
            setError('Please select a marriage to add the child to')
            return
          }
          addChild(selectedTargetId, name, gender)
          message = 'Child added to marriage!'
          break
          
        case 'parent':
          if (!selectedTargetId) {
            setError('Please select a person to add parent to')
            return
          }
          personId = addParent(selectedTargetId, name, gender)
          selectPerson(personId)
          message = 'Parent added!'
          break
          
        case 'sibling':
          if (!selectedTargetId) {
            setError('Please select a person to add sibling to')
            return
          }
          personId = addSibling(selectedTargetId, name, gender)
          selectPerson(personId)
          message = 'Sibling added!'
          break
          
        default:
          setError('Please select a relationship type')
          return
      }
      
      setSuccess(message)
      
      // Clear form for next entry and auto-focus name input
      setTimeout(() => {
        clearForm()
        setTimeout(() => {
          nameInputRef.current?.focus()
        }, 100)
      }, 1500)
      
    } catch (err) {
      if (err instanceof ValidationError) {
        // Display specific validation errors
        const errorMessages = err.errors.map(e => e.message).join(', ')
        setError(`Validation failed: ${errorMessages}`)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }
  
  const handleRelationshipChange = (type: RelationshipType, targetId?: string) => {
    setRelationshipType(type)
    setSelectedTargetId(targetId || null)
    setError(null)
    setValidationErrors([])
    
    // Smart gender defaults based on relationship context
    if (type === 'spouse' && targetId) {
      const targetPerson = data.persons.find(p => p.id === targetId)
      if (targetPerson) {
        // Set opposite gender for spouse relationships
        if (targetPerson.gender === 'M') {
          setGender('F')
        } else if (targetPerson.gender === 'F') {
          setGender('M')
        }
        // Keep 'U' if target is unknown gender
      }
    } else if (type === 'parent' || type === 'sibling') {
      // Keep unknown for parent/sibling relationships
      setGender('U')
    } else if (type === 'root') {
      // Keep unknown for root person
      setGender('U')
    }
    
    // Auto-focus logic based on relationship type
    setTimeout(() => {
      if (type === 'root') {
        // For root person, focus name input
        nameInputRef.current?.focus()
      } else if ((type as string) !== 'root' && !targetId) {
        // For non-root relationships, focus target picker if no target selected
        targetPickerRef.current?.querySelector('input')?.focus()
      } else if (targetId) {
        // If target is already selected, focus name input
        nameInputRef.current?.focus()
      }
    }, 100)
  }
  
  // Real-time validation as user types
  const validateInRealTime = () => {
    if (!name.trim() || !relationshipType) {
      setValidationErrors([])
      return
    }
    
    const preValidation = preValidatePersonCreation(name, gender, relationshipType, selectedTargetId, data)
    
    if (!preValidation.isValid) {
      setValidationErrors(preValidation.errors)
    } else {
      setValidationErrors([])
    }
  }
  
  // Handle prefilled form data
  React.useEffect(() => {
    if (prefilledForm) {
      setRelationshipType(prefilledForm.relationshipType)
      setSelectedTargetId(prefilledForm.targetId)
      setError(null)
      setValidationErrors([])
      setSuccess(`Form prefilled for ${prefilledForm.relationshipType} relationship`)
      // Clear the prefilled form after applying
      setPrefilledForm(null)
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
      // Auto-focus name input after prefilling
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 200)
    }
  }, [prefilledForm, setPrefilledForm])

  // Auto-focus when target is selected
  React.useEffect(() => {
    if (selectedTargetId && relationshipType) {
      // Smart gender defaults when target is selected
      if (relationshipType === 'spouse') {
        const targetPerson = data.persons.find(p => p.id === selectedTargetId)
        if (targetPerson) {
          if (targetPerson.gender === 'M') {
            setGender('F')
          } else if (targetPerson.gender === 'F') {
            setGender('M')
          }
        }
      }
      
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [selectedTargetId, relationshipType, data.persons])

  // Validate when form data changes
  React.useEffect(() => {
    validateInRealTime()
  }, [name, gender, relationshipType, selectedTargetId, data])
  
  const getSubmitButtonText = () => {
    if (!relationshipType) return 'Select Relationship'
    if (!name.trim()) return 'Enter Name'
    if (validationErrors.length > 0) return 'Fix Errors Above'
    
    switch (relationshipType) {
      case 'root': return 'Create Root Person'
      case 'spouse': return 'Add Spouse'
      case 'child': return 'Add Child'
      case 'parent': return 'Add Parent'
      case 'sibling': return 'Add Sibling'
      default: return 'Add Person'
    }
  }
  
  const isSubmitDisabled = !name.trim() || !relationshipType || 
    (relationshipType !== 'root' && !selectedTargetId) || validationErrors.length > 0

  // Get validation status for each field
  const getFieldValidationStatus = (field: 'name' | 'gender' | 'relationship' | 'target') => {
    if (validationErrors.length > 0) {
      const fieldErrors = validationErrors.filter(error => 
        error.toLowerCase().includes(field) || 
        (field === 'target' && (error.includes('select') || error.includes('marriage') || error.includes('person')))
      )
      if (fieldErrors.length > 0) return 'error'
    }
    
    if (field === 'name' && name.trim().length >= 2) return 'valid'
    if (field === 'gender' && gender !== 'U') return 'valid'
    if (field === 'relationship' && relationshipType) return 'valid'
    if (field === 'target' && (relationshipType === 'root' || selectedTargetId)) return 'valid'
    
    return 'neutral'
  }

  const getValidationIcon = (status: 'valid' | 'error' | 'neutral') => {
    switch (status) {
      case 'valid': return <Check size={16} className="text-green-600" />
      case 'error': return <X size={16} className="text-red-600" />
      default: return null
    }
  }

  const getValidationBorderColor = (status: 'valid' | 'error' | 'neutral') => {
    switch (status) {
      case 'valid': return 'border-green-500 focus:ring-green-500'
      case 'error': return 'border-red-500 focus:ring-red-500'
      default: return 'border-gray-300 focus:ring-blue-500'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Name and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <div className="relative">
            <input
              ref={nameInputRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${getValidationBorderColor(getFieldValidationStatus('name'))}`}
              placeholder="Enter name"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon(getFieldValidationStatus('name'))}
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender
            {relationshipType === 'spouse' && selectedTargetId && (
              <span className="text-xs text-blue-600 ml-2">
                {(() => {
                  const targetPerson = data.persons.find(p => p.id === selectedTargetId)
                  if (targetPerson?.gender === 'M') return 'Tip: This will be the wife'
                  if (targetPerson?.gender === 'F') return 'Tip: This will be the husband'
                  return ''
                })()}
              </span>
            )}
          </label>
          <div className="relative">
            <select
              ref={genderSelectRef}
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${getValidationBorderColor(getFieldValidationStatus('gender'))}`}
            >
              <option value="U">Unknown</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon(getFieldValidationStatus('gender'))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Relationship Selector */}
      <div className="space-y-4">
        <RelationshipSelector
          name={name}
          onRelationshipChange={handleRelationshipChange}
          selectedType={relationshipType}
          selectedTargetId={selectedTargetId}
        />
        
        {/* Contextual Help */}
        {relationshipType && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              {relationshipType === 'root' && (
                <div>
                  <strong>Root Person:</strong> This person will be the starting point of your family tree. 
                  You can add their spouse, children, parents, and siblings later.
                </div>
              )}
              {relationshipType === 'spouse' && (
                <div>
                  <strong>Adding Spouse:</strong> This will create a marriage between the new person and the selected person. 
                  Both people will be able to have children together.
                </div>
              )}
              {relationshipType === 'child' && (
                <div>
                  <strong>Adding Child:</strong> This person will be added as a child to the selected marriage. 
                  Both parents in the marriage will be this person's parents.
                </div>
              )}
              {relationshipType === 'parent' && (
                <div>
                  <strong>Adding Parent:</strong> This person will be added as a parent to the selected person. 
                  If the selected person already has parents, this will create a blended family situation.
                </div>
              )}
              {relationshipType === 'sibling' && (
                <div>
                  <strong>Adding Sibling:</strong> This person will be added as a sibling to the selected person. 
                  They will share the same parents (if any exist).
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Target Selection */}
      {relationshipType && relationshipType !== 'root' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {relationshipType === 'spouse' && 'Select person to marry'}
            {relationshipType === 'child' && 'Select marriage to add child to'}
            {relationshipType === 'parent' && 'Select person to add parent to'}
            {relationshipType === 'sibling' && 'Select person to add sibling to'}
          </label>
          <div ref={targetPickerRef}>
            <SmartPicker
              type={relationshipType === 'child' ? 'marriage' : 'person'}
              onSelect={setSelectedTargetId}
              selectedId={selectedTargetId}
              placeholder={`Search ${relationshipType === 'child' ? 'marriages' : 'people'}...`}
              relationshipType={relationshipType}
              targetPersonId={relationshipType === 'spouse' ? selectedTargetId || undefined : undefined}
            />
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
        <div className="grid grid-cols-2 gap-2">
          <div>⌘S - Add as spouse</div>
          <div>⌘C - Add as child</div>
          <div>⌘P - Add as parent</div>
          <div>⌘B - Add as sibling</div>
          <div>⌘Enter - Submit</div>
          <div>Esc - Clear form</div>
        </div>
      </div>
      
      {/* Form Progress Indicator */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Progress</span>
          <span className="text-sm text-gray-500">
            {(() => {
              const fields = ['name', 'gender', 'relationship', 'target']
              const completed = fields.filter(field => getFieldValidationStatus(field as any) === 'valid').length
              return `${completed}/${fields.length}`
            })()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(() => {
                const fields = ['name', 'gender', 'relationship', 'target']
                const completed = fields.filter(field => getFieldValidationStatus(field as any) === 'valid').length
                return (completed / fields.length) * 100
              })()}%` 
            }}
          />
        </div>
      </div>

      {/* Real-time Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex items-center gap-2 font-medium mb-1">
            <X size={16} />
            Cannot create person:
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Error/Success Messages */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
          {success}
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {getSubmitButtonText()}
        {!isSubmitDisabled && (
          <span className="ml-2 text-sm opacity-75">(⌘Enter)</span>
        )}
      </button>
    </div>
  )
}