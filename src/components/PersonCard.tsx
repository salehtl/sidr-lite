import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import DeletePersonDialog from './DeletePersonDialog'
import FamilyStatistics from './FamilyStatistics'
import { Trash2, Edit, Save, X, Calendar, ChevronDown, ChevronRight, Heart, Baby, Crown } from 'lucide-react'
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
  const [editingPerson, setEditingPerson] = useState<string | null>(null)
  const [editingMarriage, setEditingMarriage] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGender, setEditGender] = useState<Gender>('U')
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
    setEditGender('U')
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
                      {person.gender === 'U' && <span className="text-gray-400 text-sm">?</span>}
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
                        <div className="flex gap-2">
                          <select
                            value={editGender}
                            onChange={(e) => setEditGender(e.target.value as Gender)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="U">Unknown</option>
                          </select>
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
                          {person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Unknown'}
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
              {selectedPerson.gender === 'U' && <span className="text-gray-400">?</span>}
            </div>
          </div>
          
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
                          {child?.gender === 'U' && <span className="text-gray-400">?</span>}
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
    </div>
  )
}