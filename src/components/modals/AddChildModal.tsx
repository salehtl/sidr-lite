import { useState } from 'react'
import { X } from 'lucide-react'
import type { Gender } from '../../types/domain'

interface AddChildModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, gender: Gender) => void
  parentNames: string
}

export default function AddChildModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  parentNames
}: AddChildModalProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('M')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long')
      return
    }

    onConfirm(name.trim(), gender)
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setGender('M')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Child</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Adding child to marriage of <strong>{parentNames}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={gender === 'M'}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="mr-2"
                />
                <span className="text-sm">Male (♂)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={gender === 'F'}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="mr-2"
                />
                <span className="text-sm">Female (♀)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Child
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
