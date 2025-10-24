import { useFamilyTreeStore } from '../store/familyTreeStore'
import { Users, Heart, Baby, TrendingUp } from 'lucide-react'

export default function ProgressTracker() {
  const { data } = useFamilyTreeStore()
  
  const stats = {
    people: data.persons.length,
    marriages: data.marriages.length,
    children: data.children.length,
    generations: calculateGenerations(data)
  }
  
  const getProgressMessage = () => {
    if (stats.people === 0) return "Start building your family tree!"
    if (stats.people === 1) return "Great start! Add their spouse to continue."
    if (stats.marriages === 0) return "Add marriages to connect family members."
    if (stats.children === 0) return "Add children to grow your family tree."
    return "Your family tree is growing!"
  }
  
  const getProgressColor = () => {
    if (stats.people === 0) return "text-gray-500"
    if (stats.people < 3) return "text-blue-600"
    if (stats.people < 10) return "text-green-600"
    return "text-purple-600"
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          Family Tree Progress
        </h3>
        <span className={`text-sm font-medium ${getProgressColor()}`}>
          {stats.people} {stats.people === 1 ? 'person' : 'people'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-blue-600" />
          <span className="text-gray-600">{stats.people} people</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Heart size={16} className="text-pink-600" />
          <span className="text-gray-600">{stats.marriages} marriages</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Baby size={16} className="text-green-600" />
          <span className="text-gray-600">{stats.children} children</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-purple-600" />
          <span className="text-gray-600">{stats.generations} generations</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        {getProgressMessage()}
      </div>
    </div>
  )
}

function calculateGenerations(data: any): number {
  // Simple generation calculation based on root person and their descendants
  if (data.persons.length === 0) return 0
  
  const rootPerson = data.persons.find((p: any) => p.isRoot)
  if (!rootPerson) return 1
  
  // This is a simplified calculation - in a real implementation,
  // you'd traverse the tree to find the maximum depth
  const hasChildren = data.children.some((c: any) => 
    data.marriages.some((m: any) => 
      m.id === c.marriageId && 
      (m.husbandId === rootPerson.id || m.wifeId === rootPerson.id)
    )
  )
  
  return hasChildren ? 2 : 1
}
