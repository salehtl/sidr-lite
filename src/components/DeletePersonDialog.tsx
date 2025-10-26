import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { calculateDeletionImpact, getDeletionSummary } from '../utils/deletionHelpers'
import { Trash2, AlertTriangle, X } from 'lucide-react'

interface DeletePersonDialogProps {
  isOpen: boolean
  onClose: () => void
  personId: string | null
}

export default function DeletePersonDialog({ isOpen, onClose, personId }: DeletePersonDialogProps) {
  const { data, deletePerson } = useFamilyTreeStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRootWarning, setShowRootWarning] = useState(false)
  const [forceOrphan, setForceOrphan] = useState(false)
  const [forceRootDelete, setForceRootDelete] = useState(false)
  
  if (!isOpen || !personId) return null
  
  const person = data.persons.find(p => p.id === personId)
  if (!person) return null
  
  const impact = calculateDeletionImpact(personId, data)
  const summary = getDeletionSummary(impact)
  
  const handleDelete = async () => {
    if (!personId) return
    
    setIsDeleting(true)
    setError(null)
    
    try {
      // Check if this is the root person
      if (person.isRoot && !showRootWarning) {
        setShowRootWarning(true)
        setIsDeleting(false)
        return
      }
      
      const result = deletePerson({ 
        personId, 
        forceOrphan: forceOrphan || impact.orphanedChildren.length === 0,
        forceRootDelete: forceRootDelete || !person.isRoot
      })
      
      // Show success message (could be enhanced with toast)
      console.log(`Deleted ${result.deletedPerson.name}`)
      
      // Close dialog
      onClose()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person')
      setIsDeleting(false)
    }
  }
  
  const handleCancel = () => {
    setError(null)
    setShowRootWarning(false)
    setIsDeleting(false)
    onClose()
  }
  
  const isLastPerson = data.persons.length === 1
  const isRootPerson = person.isRoot
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 size={24} className="text-red-500" />
            Delete Person
          </h2>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Person Details */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium text-gray-900">{person.name}</h3>
            <p className="text-sm text-gray-600">
              {person.gender === 'M' ? 'Male' : 'Female'}
              {person.isRoot && ' • Root Person'}
            </p>
          </div>
          
          {/* Impact Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Deletion Impact:</p>
                <p className="text-sm text-yellow-700">{summary}</p>
              </div>
            </div>
          </div>
          
          {/* Special Warnings */}
          {isLastPerson && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning:</p>
                  <p className="text-sm text-red-700">
                    This is the last person in your family tree. Deleting them will remove all data.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isRootPerson && !showRootWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Root Person:</p>
                  <p className="text-sm text-orange-700">
                    This is your root person. Deleting them will remove the tree's starting point.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {showRootWarning && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Final Warning:</p>
                  <p className="text-sm text-red-700">
                    Are you absolutely sure you want to delete the root person? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Force Flags */}
          {impact.orphanedChildren.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Orphaned Children:</p>
                  <p className="text-sm text-yellow-700 mb-2">
                    This will orphan {impact.orphanedChildren.length} children who will become new roots.
                  </p>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={forceOrphan}
                      onChange={(e) => setForceOrphan(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-yellow-700">I understand and want to proceed</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {person.isRoot && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">Root Person Deletion:</p>
                  <p className="text-sm text-orange-700 mb-2">
                    This person is a root ancestor. Deleting will restructure the family tree.
                  </p>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={forceRootDelete}
                      onChange={(e) => setForceRootDelete(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-orange-700">I understand and want to proceed</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {/* Affected Relationships Details */}
          {(impact.marriagesToDelete.length > 0 || impact.orphanedChildren.length > 0) && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
              <div className="space-y-1 text-sm text-gray-600">
                {impact.marriagesToDelete.map(marriage => {
                  const spouse = data.persons.find(p => 
                    p.id === (marriage.husbandId === personId ? marriage.wifeId : marriage.husbandId)
                  )
                  return (
                    <div key={marriage.id}>
                      • Marriage with {spouse?.name || 'Unknown'}
                    </div>
                  )
                })}
                {impact.orphanedChildren.map(child => (
                  <div key={child.id}>
                    • Child {child.name} will be orphaned
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || (impact.orphanedChildren.length > 0 && !forceOrphan) || (person.isRoot && !forceRootDelete)}
            className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {showRootWarning ? 'Delete Anyway' : 'Delete Person'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
