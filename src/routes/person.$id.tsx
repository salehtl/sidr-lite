import { createFileRoute, Link } from '@tanstack/react-router'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export const Route = createFileRoute('/person/$id')({
  component: PersonDetailScreen,
})

function PersonDetailScreen() {
  const { id } = Route.useParams()
  const { data, selectPerson, selectMarriage } = useFamilyTreeStore()
  
  const person = data.persons.find(p => p.id === id)
  
  if (!person) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Person Not Found</h1>
          <p className="text-gray-600 mb-4">The person you're looking for doesn't exist</p>
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
  
  const marriages = data.marriages.filter(m => 
    m.husbandId === person.id || m.wifeId === person.id
  )
  
  const children = data.children.filter(c => 
    marriages.some(m => m.id === c.marriageId)
  )
  
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M': return '♂'
      case 'F': return '♀'
      default: return '?'
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {getGenderIcon(person.gender)} {person.name}
              </h1>
              <p className="text-gray-600 capitalize">
                {person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Unknown Gender'}
                {person.isRoot && ' • Root Person'}
              </p>
            </div>
            <button
              onClick={() => selectPerson(person.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Select in Tree
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marriages */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Marriages</h2>
              {marriages.length === 0 ? (
                <p className="text-gray-500">No marriages</p>
              ) : (
                <div className="space-y-3">
                  {marriages.map(marriage => {
                    const spouse = data.persons.find(p => 
                      p.id === (marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId)
                    )
                    const marriageChildren = data.children.filter(c => c.marriageId === marriage.id)
                    
                    return (
                      <div
                        key={marriage.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                        onClick={() => selectMarriage(marriage.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Marriage with {spouse?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              Status: {marriage.status}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {marriageChildren.length} child{marriageChildren.length !== 1 ? 'ren' : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Children */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Children</h2>
              {children.length === 0 ? (
                <p className="text-gray-500">No children</p>
              ) : (
                <div className="space-y-2">
                  {children.map(child => {
                    const childPerson = data.persons.find(p => p.id === child.childId)
                    return (
                      <div
                        key={child.childId}
                        className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                        onClick={() => selectPerson(child.childId)}
                      >
                        <p className="font-medium text-gray-900">
                          {getGenderIcon(childPerson?.gender || 'U')} {childPerson?.name || 'Unknown'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
