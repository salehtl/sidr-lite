import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import DeletePersonDialog from './DeletePersonDialog'
import AddParentPairDialog from './AddParentPairDialog'
import FamilyStatistics from './FamilyStatistics'
import { validateTreeNodes } from '../utils/treeValidation'
import { checkWarnings } from '../store/validators'
import { Trash2, Edit, Save, X, Calendar, ChevronDown, ChevronRight, Heart, Baby, Crown, AlertTriangle, UserPlus } from 'lucide-react'
import type { Gender } from '../types/domain'

export default function PersonCard() {
  const {
    data,
    selectedPersonId,
    selectedMarriageId,
    selectPerson,
    selectMarriage,
    updatePersonName,
    updatePersonGender,
    updateMarriageDates,
    setPrefilledForm
  } = useFamilyTreeStore()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddParentDialog, setShowAddParentDialog] = useState(false)
  const [editingPerson, setEditingPerson] = useState<string | null>(null)
  const [editingMarriage, setEditingMarriage] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGender, setEditGender] = useState<Gender>('M')
  const [editMarriageDate, setEditMarriageDate] = useState('')
  const [editDivorceDate, setEditDivorceDate] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<{
    marriages: boolean
    children: boolean
    statistics: boolean
  }>({
    marriages: false,
    children: false,
    statistics: false
  })
  
  const selectedPerson = selectedPersonId ? data.persons.find(p => p.id === selectedPersonId) : null
  
  // Check for warnings related to the selected person
  const validation = validateTreeNodes(data)
  const warningData = checkWarnings(data)
  
  const personWarnings = selectedPerson ? [
    // Check if person is isolated
    ...(Object.keys(validation.nodeErrors).includes(selectedPerson.id) && 
        validation.nodeErrors[selectedPerson.id].some(error => 
          error.includes('not connected to the family tree')
        ) ? [{
          type: 'isolated',
          message: 'Not connected to family tree',
          severity: 'warning' as const
        }] : []),
    
    // Check if person is orphaned
    ...(warningData.orphanedChildren.includes(selectedPerson.id) ? [{
      type: 'orphaned',
      message: 'This person needs parents assigned',
      severity: 'action' as const,
      actionLabel: 'Add Parents',
      actionHandler: () => handleAddParents(selectedPerson.id)
    }] : []),
    
    // Check if person has incomplete parents (only one parent)
    ...(selectedPerson && (() => {
      const childLink = data.children.find(c => c.childId === selectedPerson.id)
      if (!childLink) return false
      const marriage = data.marriages.find(m => m.id === childLink.marriageId)
      return marriage && (!marriage.husbandId || !marriage.wifeId)
    })() ? [{
      type: 'incomplete-parents',
      message: 'This person has only one parent',
      severity: 'action' as const,
      actionLabel: 'Add Other Parent',
      actionHandler: () => handleAddSecondParent(selectedPerson.id)
    }] : [])
  ] : []

  const handleAddParents = (childId: string) => {
    // For orphaned children, we need to create a new marriage
    // This will be handled by the QuickEntryForm
    setPrefilledForm({ relationshipType: 'parent', targetId: childId, targetType: 'person' })
  }
  
  const handleAddSecondParent = (childId: string) => {
    // Find the child's marriage and existing parent
    const childLink = data.children.find(c => c.childId === childId)
    if (!childLink) return
    
    const marriage = data.marriages.find(m => m.id === childLink.marriageId)
    if (!marriage) return
    
    const existingParentId = marriage.husbandId || marriage.wifeId
    if (!existingParentId) return
    
    const existingParent = data.persons.find(p => p.id === existingParentId)
    if (!existingParent) return
    
    // Open AddParentPairDialog with existing parent info
    setShowAddParentDialog(true)
  }

  const handleStartEditPerson = (personId: string) => {
    const person = data.persons.find(p => p.id === personId)
    if (person) {
      setEditingPerson(personId)
      setEditName(person.name)
      setEditGender(person.gender)
      setEditError(null)
    }
  }

  const handleSavePersonEdit = () => {
    if (!editingPerson) return
    
    setEditError(null)
    
    try {
      if (editName.trim() !== selectedPerson?.name) {
        updatePersonName(editingPerson, editName.trim())
      }
      if (editGender !== selectedPerson?.gender) {
        updatePersonGender(editingPerson, editGender)
      }
      setEditingPerson(null)
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update person')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (editingPerson) {
        handleSavePersonEdit()
      } else if (editingMarriage) {
        handleSaveMarriageEdit()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (editingPerson) {
        handleCancelPersonEdit()
      } else if (editingMarriage) {
        handleCancelMarriageEdit()
      }
    }
  }

  const handleCancelPersonEdit = () => {
    setEditingPerson(null)
    setEditName('')
    setEditGender('M')
    setEditError(null)
  }

  const handleStartEditMarriage = (marriageId: string) => {
    const marriage = data.marriages.find(m => m.id === marriageId)
    if (marriage) {
      setEditingMarriage(marriageId)
      setEditMarriageDate(marriage.marriageDate || '')
      setEditDivorceDate(marriage.divorceDate || '')
      setEditError(null)
    }
  }

  const handleSaveMarriageEdit = () => {
    if (!editingMarriage) return
    
    setEditError(null)
    
    try {
      updateMarriageDates(
        editingMarriage,
        editMarriageDate.trim() || null,
        editDivorceDate.trim() || null
      )
      setEditingMarriage(null)
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update marriage dates')
    }
  }

  const handleCancelMarriageEdit = () => {
    setEditingMarriage(null)
    setEditMarriageDate('')
    setEditDivorceDate('')
    setEditError(null)
  }
  
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (data.persons.length === 0) {
    return (
      <div className="space-y-4">
        <FamilyStatistics />
        <div className="text-center text-gray-500 py-8">
          <p>No family members yet</p>
          <p className="text-sm">Add your first person to get started</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Family Statistics */}
      <FamilyStatistics />
      
      {/* Family Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Family Members</h3>
          <span className="text-sm text-gray-500">{data.persons.length} people</span>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {data.persons.map(person => {
            const marriages = data.marriages.filter(m => 
              m.husbandId === person.id || m.wifeId === person.id
            )
            const children = data.children.filter(c => 
              marriages.some(m => m.id === c.marriageId)
            )
            
            return (
              <div
                key={person.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPersonId === person.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectPerson(person.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {person.isRoot && <Crown size={14} className="text-yellow-600" />}
                      {person.gender === 'M' && <span className="text-blue-600 text-sm">♂</span>}
                      {person.gender === 'F' && <span className="text-pink-600 text-sm">♀</span>}
                    </div>
                    {editingPerson === person.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter name (Ctrl+Enter to save, Escape to cancel)"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <label className={`flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-all duration-200 ${
                            editGender === 'M' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input
                              type="radio"
                              name="editGender"
                              value="M"
                              checked={editGender === 'M'}
                              onChange={(e) => setEditGender(e.target.value as Gender)}
                              className="sr-only"
                            />
                            <span className="text-xs font-medium">Male (♂)</span>
                          </label>
                          <label className={`flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-all duration-200 ${
                            editGender === 'F' 
                              ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input
                              type="radio"
                              name="editGender"
                              value="F"
                              checked={editGender === 'F'}
                              onChange={(e) => setEditGender(e.target.value as Gender)}
                              className="sr-only"
                            />
                            <span className="text-xs font-medium">Female (♀)</span>
                          </label>
                          <button
                            onClick={handleSavePersonEdit}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          >
                            <Save size={12} />
                            Save
                          </button>
                          <button
                            onClick={handleCancelPersonEdit}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{person.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEditPerson(person.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Edit person"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          {person.gender === 'M' ? 'Male' : 'Female'}
                          {person.isRoot && ' • Root'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-pink-500" />
                      {marriages.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Baby size={12} className="text-green-500" />
                      {children.length}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Selected Person Details */}
      {selectedPerson && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Selected: {selectedPerson.name}</h3>
            <div className="flex items-center gap-2">
              {selectedPerson.isRoot && <Crown size={16} className="text-yellow-600" />}
              {selectedPerson.gender === 'M' && <span className="text-blue-600">♂</span>}
              {selectedPerson.gender === 'F' && <span className="text-pink-600">♀</span>}
            </div>
          </div>
          
          {/* Warning Indicators */}
          {personWarnings.length > 0 && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              {personWarnings.map((warning, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle 
                      size={14} 
                      className={warning.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'} 
                    />
                    <span className={warning.severity === 'warning' ? 'text-yellow-800' : 'text-blue-800'}>
                      {warning.message}
                    </span>
                  </div>
                  {warning.severity === 'action' && warning.actionLabel && warning.actionHandler && (
                    <button
                      onClick={warning.actionHandler}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {warning.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Marriages Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('marriages')}
              className="flex items-center gap-2 w-full text-left font-medium text-gray-900 mb-2"
            >
              {collapsedSections.marriages ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              <Heart size={16} className="text-pink-600" />
              Marriages ({data.marriages.filter(m => m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id).length})
            </button>
            
            {!collapsedSections.marriages && data.marriages
              .filter(m => m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id)
              .map(marriage => {
                const spouse = data.persons.find(p => 
                  p.id === (marriage.husbandId === selectedPerson.id ? marriage.wifeId : marriage.husbandId)
                )
                const children = data.children.filter(c => c.marriageId === marriage.id)
                
                return (
                  <div
                    key={marriage.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedMarriageId === marriage.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectMarriage(marriage.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingMarriage === marriage.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Marriage with {spouse?.name || 'Unknown'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEditMarriage(marriage.id)
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Edit marriage dates"
                              >
                                <Calendar size={14} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <input
                                type="date"
                                value={editMarriageDate}
                                onChange={(e) => setEditMarriageDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Marriage date"
                              />
                              <input
                                type="date"
                                value={editDivorceDate}
                                onChange={(e) => setEditDivorceDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Divorce date (optional)"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveMarriageEdit}
                                className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                              >
                                <Save size={12} />
                                Save
                              </button>
                              <button
                                onClick={handleCancelMarriageEdit}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                Marriage with {spouse?.name || 'Unknown'}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEditMarriage(marriage.id)
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Edit marriage dates"
                              >
                                <Calendar size={14} />
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 capitalize">
                              Status: {marriage.status}
                              {marriage.marriageDate && ` • Married: ${new Date(marriage.marriageDate).toLocaleDateString()}`}
                              {marriage.divorceDate && ` • Divorced: ${new Date(marriage.divorceDate).toLocaleDateString()}`}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {children.length} child{children.length !== 1 ? 'ren' : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Children Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('children')}
              className="flex items-center gap-2 w-full text-left font-medium text-gray-900 mb-2"
            >
              {collapsedSections.children ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              <Baby size={16} className="text-green-600" />
              Children ({data.children.filter(c => 
                data.marriages.some(m => 
                  m.id === c.marriageId && 
                  (m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id)
                )
              ).length})
            </button>
            
            {!collapsedSections.children && (
              <div className="space-y-2">
                {data.children
                  .filter(c => 
                    data.marriages.some(m => 
                      m.id === c.marriageId && 
                      (m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id)
                    )
                  )
                  .map(childLink => {
                    const child = data.persons.find(p => p.id === childLink.childId)
                    return (
                      <div key={childLink.childId} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          {child?.gender === 'M' && <span className="text-blue-600">♂</span>}
                          {child?.gender === 'F' && <span className="text-pink-600">♀</span>}
                          <span className="font-medium">{child?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Error Display */}
          {editError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{editError}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 space-y-2">
            {selectedPerson.gender === 'M' && (
              <button
                onClick={() => {
                  setPrefilledForm({
                    relationshipType: 'spouse',
                    targetId: selectedPerson.id,
                    targetType: 'person'
                  })
                }}
                className="w-full text-sm bg-green-100 text-green-700 py-2 px-3 rounded hover:bg-green-200 transition-colors"
              >
                Add Wife
              </button>
            )}
            
            {selectedPerson.gender === 'F' && (
              <button
                onClick={() => {
                  setPrefilledForm({
                    relationshipType: 'spouse',
                    targetId: selectedPerson.id,
                    targetType: 'person'
                  })
                }}
                className="w-full text-sm bg-green-100 text-green-700 py-2 px-3 rounded hover:bg-green-200 transition-colors"
              >
                Add Husband
              </button>
            )}
            
            {data.marriages.filter(m => m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id).length > 0 && (
              <button
                onClick={() => {
                  // Find the first marriage for this person
                  const marriage = data.marriages.find(m => m.husbandId === selectedPerson.id || m.wifeId === selectedPerson.id)
                  if (marriage) {
                    setPrefilledForm({
                      relationshipType: 'child',
                      targetId: marriage.id,
                      targetType: 'marriage'
                    })
                  }
                }}
                className="w-full text-sm bg-blue-100 text-blue-700 py-2 px-3 rounded hover:bg-blue-200 transition-colors"
              >
                Add Child to Marriage
              </button>
            )}
            
            <button
              onClick={() => {
                setPrefilledForm({
                  relationshipType: 'sibling',
                  targetId: selectedPerson.id,
                  targetType: 'person'
                })
              }}
              className="w-full text-sm bg-purple-100 text-purple-700 py-2 px-3 rounded hover:bg-purple-200 transition-colors"
            >
              Add Sibling
            </button>
            
            <button
              onClick={() => {
                setPrefilledForm({
                  relationshipType: 'parent',
                  targetId: selectedPerson.id,
                  targetType: 'person'
                })
              }}
              className="w-full text-sm bg-orange-100 text-orange-700 py-2 px-3 rounded hover:bg-orange-200 transition-colors"
            >
              Add Parent
            </button>
            
            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full text-sm bg-red-100 text-red-700 py-2 px-3 rounded hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Delete Person
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeletePersonDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        personId={selectedPersonId}
      />
      
      {/* Add Parent Pair Dialog */}
      {selectedPerson && (() => {
        const childLink = data.children.find(c => c.childId === selectedPerson.id)
        if (!childLink) return null
        
        const marriage = data.marriages.find(m => m.id === childLink.marriageId)
        if (!marriage) return null
        
        const existingParentId = marriage.husbandId || marriage.wifeId
        if (!existingParentId) return null
        
        const existingParent = data.persons.find(p => p.id === existingParentId)
        if (!existingParent) return null
        
        return (
          <AddParentPairDialog
            isOpen={showAddParentDialog}
            onClose={() => setShowAddParentDialog(false)}
            childId={selectedPerson.id}
            marriageId={marriage.id}
            existingParentGender={existingParent.gender}
            suggestedGender={existingParent.gender === 'M' ? 'F' : 'M'}
          />
        )
      })()}
    </div>
  )
}