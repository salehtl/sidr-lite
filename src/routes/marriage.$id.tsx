import { createFileRoute, Link } from '@tanstack/react-router'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export const Route = createFileRoute('/marriage/$id')({
  component: MarriageDetailScreen,
})

function MarriageDetailScreen() {
  const { id } = Route.useParams()
  const { data, selectPerson, selectMarriage, setMarriageStatus } = useFamilyTreeStore()
  
  const marriage = data.marriages.find(m => m.id === id)
  
  if (!marriage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Marriage Not Found</h1>
          <p className="text-gray-600 mb-4">The marriage you're looking for doesn't exist</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }
  
  const husband = data.persons.find(p => p.id === marriage.husbandId)
  const wife = data.persons.find(p => p.id === marriage.wifeId)
  const children = data.children.filter(c => c.marriageId === marriage.id)
  
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M': return '♂'
      case 'F': return '♀'
      default: return '?'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'divorced': return 'bg-red-100 text-red-800'
      case 'widowed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/tree"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Tree
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Marriage Details</h1>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(marriage.status)}`}>
                  {marriage.status.charAt(0).toUpperCase() + marriage.status.slice(1)}
                </span>
                {marriage.marriageDate && (
                  <span className="text-gray-600">
                    Married: {new Date(marriage.marriageDate).toLocaleDateString()}
                  </span>
                )}
                {marriage.divorceDate && (
                  <span className="text-gray-600">
                    Divorced: {new Date(marriage.divorceDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => selectMarriage(marriage.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Select in Tree
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Husband */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Husband</h3>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => selectPerson(marriage.husbandId)}
              >
                <span className="text-lg">{getGenderIcon(husband?.gender || 'U')}</span>
                <span className="font-medium">{husband?.name || 'Unknown'}</span>
              </div>
            </div>
            
            {/* Wife */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wife</h3>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => selectPerson(marriage.wifeId)}
              >
                <span className="text-lg">{getGenderIcon(wife?.gender || 'U')}</span>
                <span className="font-medium">{wife?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          {/* Children */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Children ({children.length})</h2>
            {children.length === 0 ? (
              <p className="text-gray-500">No children</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children.map(child => {
                  const childPerson = data.persons.find(p => p.id === child.childId)
                  return (
                    <div
                      key={child.childId}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                      onClick={() => selectPerson(child.childId)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getGenderIcon(childPerson?.gender || 'U')}</span>
                        <span className="font-medium">{childPerson?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Status Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Change Status</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMarriageStatus(marriage.id, 'active')}
                disabled={marriage.status === 'active'}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Active
              </button>
              <button
                onClick={() => setMarriageStatus(marriage.id, 'divorced')}
                disabled={marriage.status === 'divorced'}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Divorced
              </button>
              <button
                onClick={() => setMarriageStatus(marriage.id, 'widowed')}
                disabled={marriage.status === 'widowed'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Widowed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
