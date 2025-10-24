import React from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { Users, Heart, Baby, Crown, Filter } from 'lucide-react'

export default function FamilyStatistics() {
  const { data } = useFamilyTreeStore()
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'root' | 'recent' | 'issues'>('all')
  
  const stats = {
    totalPeople: data.persons.length,
    totalMarriages: data.marriages.length,
    totalChildren: data.children.length,
    rootPerson: data.persons.find(p => p.isRoot),
    recentAdditions: data.persons.slice(-3), // Last 3 added
    issues: getIssues(data)
  }
  
  const filters = [
    { id: 'all', label: 'All', count: stats.totalPeople },
    { id: 'root', label: 'Root Only', count: stats.rootPerson ? 1 : 0 },
    { id: 'recent', label: 'Recent', count: stats.recentAdditions.length },
    { id: 'issues', label: 'Has Issues', count: stats.issues.length }
  ]
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          Family Statistics
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Filter size={14} />
          <span>Filter</span>
        </div>
      </div>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">{stats.totalPeople}</div>
            <div className="text-xs text-gray-500">People</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Heart size={16} className="text-pink-600" />
          <div>
            <div className="font-medium text-gray-900">{stats.totalMarriages}</div>
            <div className="text-xs text-gray-500">Marriages</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Baby size={16} className="text-green-600" />
          <div>
            <div className="font-medium text-gray-900">{stats.totalChildren}</div>
            <div className="text-xs text-gray-500">Children</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Crown size={16} className="text-yellow-600" />
          <div>
            <div className="font-medium text-gray-900">{stats.rootPerson ? '1' : '0'}</div>
            <div className="text-xs text-gray-500">Root</div>
          </div>
        </div>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
      
      {/* Issues Summary */}
      {stats.issues.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-xs text-yellow-800">
            <strong>Issues found:</strong> {stats.issues.length} items need attention
          </div>
        </div>
      )}
    </div>
  )
}

function getIssues(data: any): string[] {
  const issues: string[] = []
  
  // Check for persons without spouses
  const personsWithoutSpouses = data.persons.filter((person: any) => {
    const hasMarriage = data.marriages.some((m: any) => 
      m.husbandId === person.id || m.wifeId === person.id
    )
    return !hasMarriage && !person.isRoot
  })
  
  if (personsWithoutSpouses.length > 0) {
    issues.push(`${personsWithoutSpouses.length} person(s) without spouse`)
  }
  
  // Check for marriages without children
  const marriagesWithoutChildren = data.marriages.filter((marriage: any) => {
    const hasChildren = data.children.some((c: any) => c.marriageId === marriage.id)
    return !hasChildren
  })
  
  if (marriagesWithoutChildren.length > 0) {
    issues.push(`${marriagesWithoutChildren.length} marriage(s) without children`)
  }
  
  // Check for persons with unknown gender
  const unknownGender = data.persons.filter((p: any) => p.gender === 'U')
  if (unknownGender.length > 0) {
    issues.push(`${unknownGender.length} person(s) with unknown gender`)
  }
  
  return issues
}
