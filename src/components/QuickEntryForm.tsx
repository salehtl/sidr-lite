import React, { useState, useRef } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { useKeyboardNav, createShortcuts } from '../hooks/useKeyboardNav'
import { ValidationError } from '../store/validators'
import { preValidatePersonCreation } from '../utils/preValidationHelpers'
import { Check, X } from 'lucide-react'
import type { Gender, RelationshipType } from '../types/domain'
import RelationshipSelector from './RelationshipSelector'
import SmartPicker from './SmartPicker'
import NameAutocomplete, { useNameLearning } from './NameAutocomplete'

export default function QuickEntryForm() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('M')
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [lastCreatedPerson, setLastCreatedPerson] = useState<{id: string, type: RelationshipType, targetId?: string, marriageId?: string} | null>(null)
  
  const { learnName } = useNameLearning()
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const targetPickerRef = useRef<HTMLDivElement>(null)
  
  const {
    createPerson,
    createMarriage,
    addChild,
    addSibling,
    addParent,
    completeParentMarriage,
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
  
  function clearForm(preserveContext = false) {
    setName('')
    if (!preserveContext) {
      setRelationshipType(null)
      setSelectedTargetId(null)
    }
    setError(null)
    setSuccess(null)
    setLastCreatedPerson(null)
    nameInputRef.current?.focus()
  }

  // Quick action functions
  function prefillForSibling(personId: string) {
    const person = data.persons.find(p => p.id === personId)
    if (!person) return
    
    // Find the person's parents
    const childLink = data.children.find(c => c.childId === personId)
    if (childLink) {
      const marriage = data.marriages.find(m => m.id === childLink.marriageId)
      if (marriage) {
        setRelationshipType('child')
        setSelectedTargetId(marriage.id)
        setGender(person.gender) // Same gender as sibling
        nameInputRef.current?.focus()
      }
    }
  }

  function prefillForSpouse(personId: string) {
    const person = data.persons.find(p => p.id === personId)
    if (!person) return
    
    setRelationshipType('spouse')
    setSelectedTargetId(personId)
    setGender(person.gender === 'M' ? 'F' : 'M') // Opposite gender
    nameInputRef.current?.focus()
  }

  function prefillForChild(marriageId: string) {
    setRelationshipType('child')
    setSelectedTargetId(marriageId)
    setGender('M') // Default to male
    nameInputRef.current?.focus()
  }

  function prefillForParent(childId: string) {
    setRelationshipType('parent')
    setSelectedTargetId(childId)
    setGender('M') // Default to male
    nameInputRef.current?.focus()
  }

  function prefillForSecondParent(marriageId: string) {
    setRelationshipType('parent')
    setSelectedTargetId(null) // No target needed for completion
    setGender('M') // Default to male
    nameInputRef.current?.focus()
    
    // Store marriage ID for completion
    setLastCreatedPerson(prev => prev ? { ...prev, marriageId } : null)
  }

  // Intelligent next person suggestion
  function getSuggestedNextAction(): { relationshipType: RelationshipType; targetId?: string; gender: Gender; message: string } | null {
    const persons = data.persons
    const marriages = data.marriages
    const children = data.children

    // If no persons, suggest root
    if (persons.length === 0) {
      return {
        relationshipType: 'root',
        gender: 'M',
        message: 'Start by adding the first person (root)'
      }
    }

    // If only one person (root), suggest spouse
    if (persons.length === 1) {
      const rootPerson = persons[0]
      return {
        relationshipType: 'spouse',
        targetId: rootPerson.id,
        gender: rootPerson.gender === 'M' ? 'F' : 'M',
        message: `Add spouse for ${rootPerson.name}`
      }
    }

    // Find persons without spouses
    const personsWithoutSpouses = persons.filter(person => {
      const hasActiveMarriage = marriages.some(m => 
        m.status === 'active' && (m.husbandId === person.id || m.wifeId === person.id)
      )
      return !hasActiveMarriage
    })

    if (personsWithoutSpouses.length > 0) {
      const person = personsWithoutSpouses[0]
      return {
        relationshipType: 'spouse',
        targetId: person.id,
        gender: person.gender === 'M' ? 'F' : 'M',
        message: `Add spouse for ${person.name}`
      }
    }

    // Find marriages without children
    const marriagesWithoutChildren = marriages.filter(marriage => {
      const hasChildren = children.some(c => c.marriageId === marriage.id)
      return marriage.status === 'active' && !hasChildren
    })

    if (marriagesWithoutChildren.length > 0) {
      const marriage = marriagesWithoutChildren[0]
      const husband = persons.find(p => p.id === marriage.husbandId)
      const wife = persons.find(p => p.id === marriage.wifeId)
      return {
        relationshipType: 'child',
        targetId: marriage.id,
        gender: 'M',
        message: `Add child to ${husband?.name} & ${wife?.name}`
      }
    }

    // Find persons with only one parent
    const personsWithOneParent = persons.filter(person => {
      const parentCount = children.filter(c => c.childId === person.id).length
      return parentCount === 1
    })

    if (personsWithOneParent.length > 0) {
      const person = personsWithOneParent[0]
      return {
        relationshipType: 'parent',
        targetId: person.id,
        gender: 'M',
        message: `Add other parent for ${person.name}`
      }
    }

    // Find persons with parents but no siblings
    const personsWithParents = persons.filter(person => {
      const hasParents = children.some(c => c.childId === person.id)
      return hasParents
    })

    if (personsWithParents.length > 0) {
      const person = personsWithParents[0]
      return {
        relationshipType: 'sibling',
        targetId: person.id,
        gender: person.gender === 'M' ? 'F' : 'M',
        message: `Add sibling for ${person.name}`
      }
    }

    return null
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
      let personId: string = ''
      let message: string = ''
      
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
          personId = addChild(selectedTargetId, name, gender)
          message = 'Child added to marriage!'
          break
          
        case 'parent':
          if (!selectedTargetId && !lastCreatedPerson?.marriageId) {
            setError('Please select a person to add parent to')
            return
          }
          
          if (lastCreatedPerson?.marriageId) {
            // Completing a parent marriage
            personId = createPerson(name, gender)
            completeParentMarriage(lastCreatedPerson.marriageId, personId)
            selectPerson(personId)
            message = 'Second parent added! Parent pair completed!'
            setLastCreatedPerson(null) // Clear the context
          } else {
            // Adding first parent
            if (!selectedTargetId) {
              setError('Please select a person to add parent to')
              return
            }
            personId = addParent(selectedTargetId, name, gender)
            selectPerson(personId)
            
            // Check if marriage is incomplete after adding parent
            const childLink = data.children.find(c => c.childId === selectedTargetId)
            const marriage = childLink ? data.marriages.find(m => m.id === childLink.marriageId) : null
            const isIncomplete = marriage && (!marriage.husbandId || !marriage.wifeId)
            
            if (isIncomplete) {
              message = 'First parent added! Add the other parent?'
              setLastCreatedPerson({ 
                id: personId, 
                type: 'parent', 
                targetId: selectedTargetId,
                marriageId: marriage!.id // Store for completion
              })
            } else {
              message = 'Parent added!'
            }
          }
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
      setLastCreatedPerson({ id: personId, type: relationshipType, targetId: selectedTargetId || undefined })
      
      // Learn the name for future suggestions
      learnName(name, gender)
      
      // Clear form for next entry and auto-focus name input
      setTimeout(() => {
        clearForm(true) // Preserve context for quick actions
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
        // Default to opposite gender
      }
    } else if (type === 'parent' || type === 'sibling') {
      // Default to male for parent/sibling relationships
      setGender('M')
    } else if (type === 'root') {
      // Default to male for root person
      setGender('M')
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

  // Enhanced Enter key handling - now handled by NameAutocomplete component
  
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
    if (field === 'gender') return 'valid'
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
            <NameAutocomplete
              value={name}
              onChange={setName}
              gender={gender}
              placeholder="Enter name"
              className={`w-full ${getValidationBorderColor(getFieldValidationStatus('name'))}`}
              existingNames={data.persons.map(p => p.name)}
              onFocus={() => nameInputRef.current?.focus()}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
            <div className={`flex border rounded-md overflow-hidden ${getValidationBorderColor(getFieldValidationStatus('gender'))}`}>
              <label className={`flex-1 flex items-center justify-center px-3 py-2 cursor-pointer transition-all duration-200 ${
                gender === 'M' 
                  ? 'bg-blue-50 text-blue-700 border-r border-blue-200' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={gender === 'M'}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Male (♂)</span>
              </label>
              <label className={`flex-1 flex items-center justify-center px-3 py-2 cursor-pointer transition-all duration-200 ${
                gender === 'F' 
                  ? 'bg-pink-50 text-pink-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={gender === 'F'}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Female (♀)</span>
              </label>
            </div>
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

      {/* Smart Suggestion */}
      {!success && !error && (
        (() => {
          const suggestion = getSuggestedNextAction()
          if (!suggestion) return null
          
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Smart Suggestion</span>
              </div>
              <p className="text-sm text-blue-800 mb-3">{suggestion.message}</p>
              <button
                onClick={() => {
                  setRelationshipType(suggestion.relationshipType)
                  if (suggestion.targetId) {
                    setSelectedTargetId(suggestion.targetId)
                  }
                  setGender(suggestion.gender)
                  nameInputRef.current?.focus()
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Use This Suggestion
              </button>
            </div>
          )
        })()
      )}

      {/* Quick Action Buttons */}
      {success && lastCreatedPerson && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm font-medium text-blue-900 mb-3">Quick Actions:</div>
          <div className="flex flex-wrap gap-2">
            {lastCreatedPerson.type === 'child' && lastCreatedPerson.targetId && (
              <button
                onClick={() => prefillForChild(lastCreatedPerson.targetId!)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Another Child
              </button>
            )}
            {lastCreatedPerson.type === 'root' && (
              <button
                onClick={() => prefillForSpouse(lastCreatedPerson.id)}
                className="px-3 py-1 bg-pink-600 text-white text-sm rounded-md hover:bg-pink-700 transition-colors"
              >
                + Add Spouse
              </button>
            )}
            {lastCreatedPerson.type === 'spouse' && lastCreatedPerson.targetId && (
              <button
                onClick={() => prefillForChild(lastCreatedPerson.targetId!)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Child
              </button>
            )}
            {lastCreatedPerson.type === 'child' && lastCreatedPerson.id && (
              <button
                onClick={() => prefillForSibling(lastCreatedPerson.id)}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
              >
                + Add Sibling
              </button>
            )}
            {lastCreatedPerson.type === 'parent' && lastCreatedPerson.marriageId && (
              <button
                onClick={() => prefillForSecondParent(lastCreatedPerson.marriageId)}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
              >
                + Add Other Parent
              </button>
            )}
            <button
              onClick={() => setLastCreatedPerson(null)}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
            >
              ✕ Dismiss
            </button>
          </div>
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