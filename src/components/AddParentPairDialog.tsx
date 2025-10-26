import React, { useState, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { preValidateParentCompletion } from '../utils/preValidationHelpers'
import { X, Users, UserPlus } from 'lucide-react'
import type { Gender } from '../types/domain'

interface AddParentPairDialogProps {
  isOpen: boolean
  onClose: () => void
  childId: string
  marriageId: string
  existingParentGender: Gender
  suggestedGender: Gender
}

export default function AddParentPairDialog({
  isOpen,
  onClose,
  childId,
  marriageId,
  existingParentGender,
  suggestedGender
}: AddParentPairDialogProps) {
  const [parentName, setParentName] = useState('')
  const [parentGender, setParentGender] = useState<Gender>(suggestedGender)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, createPerson, completeParentMarriage, selectPerson } = useFamilyTreeStore()

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setParentName('')
      setParentGender(suggestedGender)
      setError(null)
    }
  }, [isOpen, suggestedGender])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Pre-validate the operation
      const parentId = createPerson(parentName, parentGender)
      
      // Pre-validate parent completion
      const preValidation = preValidateParentCompletion(marriageId, parentId, data)
      if (!preValidation.isValid) {
        setError(preValidation.errors.join(', '))
        return
      }

      // Complete the parent marriage
      completeParentMarriage(marriageId, parentId)
      
      // Select the new parent
      selectPerson(parentId)
      
      // Close dialog
      onClose()
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Complete Parent Pair</h2>
              <p className="text-sm text-gray-600">Add the other parent to complete the family</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Family Structure Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-blue-600 font-medium">
                    {existingParentGender === 'M' ? '♂' : '♀'}
                  </span>
                </div>
                <div className="text-gray-600">Existing Parent</div>
              </div>
              <div className="text-gray-400">+</div>
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <UserPlus className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-gray-600">New Parent</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-green-600 font-medium">👶</span>
                </div>
                <div className="text-gray-600">Child</div>
              </div>
            </div>
          </div>

          {/* Parent Name Input */}
          <div>
            <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Name
            </label>
            <input
              id="parentName"
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Enter parent's name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={parentGender === 'M'}
                  onChange={(e) => setParentGender(e.target.value as Gender)}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className={`w-full py-2 px-3 text-center rounded-md border cursor-pointer transition-colors ${
                  parentGender === 'M' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}>
                  Male
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={parentGender === 'F'}
                  onChange={(e) => setParentGender(e.target.value as Gender)}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className={`w-full py-2 px-3 text-center rounded-md border cursor-pointer transition-colors ${
                  parentGender === 'F' 
                    ? 'bg-pink-600 text-white border-pink-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}>
                  Female
                </div>
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!parentName.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Complete Parent Pair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
