import { createFileRoute } from '@tanstack/react-router'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { downloadJSON } from '../utils/storage'

export const Route = createFileRoute('/settings')({
  component: SettingsScreen,
})

function SettingsScreen() {
  const {
    data,
    isRTL,
    setRTL,
    clearData,
    exportData
  } = useFamilyTreeStore()
  
  const handleExport = () => {
    const data = exportData()
    downloadJSON(data, 'family-tree.json')
  }
  
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearData()
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* RTL Support */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Language & Layout</h2>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="rtl"
                  checked={isRTL}
                  onChange={(e) => setRTL(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rtl" className="text-sm text-gray-700">
                  Right-to-left (RTL) layout for Arabic/Hebrew
                </label>
              </div>
            </div>
            
            {/* Data Management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Management</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Export Data</p>
                    <p className="text-sm text-gray-500">Download your family tree as JSON</p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Export
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Clear All Data</p>
                    <p className="text-sm text-gray-500">Remove all family tree data</p>
                  </div>
                  <button
                    onClick={handleClear}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            
            {/* Family Tree Stats */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Family Tree Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.persons.length}</p>
                  <p className="text-sm text-blue-800">People</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.marriages.length}</p>
                  <p className="text-sm text-green-800">Marriages</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{data.children.length}</p>
                  <p className="text-sm text-purple-800">Children</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {data.persons.filter(p => p.isRoot).length}
                  </p>
                  <p className="text-sm text-orange-800">Roots</p>
                </div>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Privacy Notice</h3>
              <p className="text-sm text-yellow-700">
                All data is stored locally in your browser. No data is sent to any servers.
                Your family tree remains private and secure on your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
