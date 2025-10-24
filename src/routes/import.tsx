import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { uploadJSON } from '../utils/storage'

export const Route = createFileRoute('/import')({
  component: ImportScreen,
})

function ImportScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const loadData = useFamilyTreeStore(state => state.loadData)
  
  const handleFileUpload = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const data = await uploadJSON()
      loadData(data)
      setSuccess('Family tree imported successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Family Tree</h1>
          <p className="text-gray-600 mb-6">
            Upload a JSON file to import your family tree data
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          <button
            onClick={handleFileUpload}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Importing...' : 'Choose JSON File'}
          </button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Supported format: JSON file with family tree data</p>
            <p>This will replace your current family tree data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
