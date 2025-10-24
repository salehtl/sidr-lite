import { createFileRoute, Link } from '@tanstack/react-router'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export const Route = createFileRoute('/')({
  component: WelcomeScreen,
})

function WelcomeScreen() {
  const data = useFamilyTreeStore(state => state.data)
  const hasData = data.persons.length > 0
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Tree</h1>
        <p className="text-gray-600 mb-8">Privacy-first family tree builder</p>
        
        {hasData ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You have {data.persons.length} people in your family tree
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/quick-entry"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Building
              </Link>
              <Link
                to="/tree"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Tree
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Start building your family tree by adding the first person
            </p>
            <Link
              to="/quick-entry"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Start Building
            </Link>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-4 text-sm">
            <Link
              to="/import"
              className="text-blue-600 hover:text-blue-700"
            >
              Import JSON
            </Link>
            <Link
              to="/settings"
              className="text-gray-600 hover:text-gray-700"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
