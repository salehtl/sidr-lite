import { Link } from '@tanstack/react-router'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export default function Header() {
  const { isRTL, setRTL, data } = useFamilyTreeStore()
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Family Tree
            </Link>
            {data.persons.length > 0 && (
              <nav className="ml-8 flex space-x-4">
                <Link
                  to="/quick-entry"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Quick Entry
                </Link>
                <Link
                  to="/tree"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Tree View
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setRTL(!isRTL)}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
              title="Toggle RTL/LTR"
            >
              {isRTL ? 'LTR' : 'RTL'}
            </button>
            
            <Link
              to="/settings"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}