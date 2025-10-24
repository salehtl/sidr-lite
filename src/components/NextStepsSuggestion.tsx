import { useFamilyTreeStore } from '../store/familyTreeStore'
import { ArrowRight, Plus, Heart, Baby, UserCheck, Users, Lightbulb } from 'lucide-react'

export default function NextStepsSuggestion() {
  const { data } = useFamilyTreeStore()
  
  const suggestions = getNextStepsSuggestions(data)
  
  if (suggestions.length === 0) {
    return null
  }
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-yellow-600" />
        <h3 className="font-semibold text-gray-900">Suggested Next Steps</h3>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-green-200 hover:border-green-300 transition-colors">
            <div className="flex items-center gap-3">
              {getSuggestionIcon(suggestion.type)}
              <div>
                <div className="font-medium text-gray-900">{suggestion.title}</div>
                <div className="text-sm text-gray-600">{suggestion.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
            >
              <Plus size={14} />
              Add
              <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function getSuggestionIcon(type: string) {
  switch (type) {
    case 'spouse': return <Heart size={16} className="text-pink-600" />
    case 'child': return <Baby size={16} className="text-blue-600" />
    case 'parent': return <UserCheck size={16} className="text-orange-600" />
    case 'sibling': return <Users size={16} className="text-purple-600" />
    default: return <Plus size={16} className="text-gray-600" />
  }
}

function handleSuggestionClick(suggestion: any) {
  // This would trigger the prefilled form
  // Implementation depends on how the parent component handles this
  console.log('Suggestion clicked:', suggestion)
}

function getNextStepsSuggestions(data: any): Array<{
  type: string
  title: string
  description: string
  targetId?: string
  targetName?: string
}> {
  const suggestions: Array<{
    type: string
    title: string
    description: string
    targetId?: string
    targetName?: string
  }> = []
  
  // If no people, suggest adding root person
  if (data.persons.length === 0) {
    suggestions.push({
      type: 'root',
      title: 'Add your first person',
      description: 'Start your family tree by adding the root person'
    })
    return suggestions
  }
  
  // Find root person
  const rootPerson = data.persons.find((p: any) => p.isRoot)
  
  // If root person has no spouse, suggest adding spouse
  if (rootPerson) {
    const hasSpouse = data.marriages.some((m: any) => 
      m.husbandId === rootPerson.id || m.wifeId === rootPerson.id
    )
    
    if (!hasSpouse) {
      suggestions.push({
        type: 'spouse',
        title: `Add spouse for ${rootPerson.name}`,
        description: 'Complete the family by adding their spouse',
        targetId: rootPerson.id,
        targetName: rootPerson.name
      })
    }
  }
  
  // Find marriages without children
  const marriagesWithoutChildren = data.marriages.filter((marriage: any) => {
    const hasChildren = data.children.some((c: any) => c.marriageId === marriage.id)
    return !hasChildren
  })
  
  marriagesWithoutChildren.forEach((marriage: any) => {
    const husband = data.persons.find((p: any) => p.id === marriage.husbandId)
    const wife = data.persons.find((p: any) => p.id === marriage.wifeId)
    
    if (husband && wife) {
      suggestions.push({
        type: 'child',
        title: `Add child to ${husband.name} & ${wife.name}`,
        description: 'Add children to this marriage',
        targetId: marriage.id,
        targetName: `${husband.name} & ${wife.name}`
      })
    }
  })
  
  // Find persons without parents (except root)
  const personsWithoutParents = data.persons.filter((person: any) => {
    if (person.isRoot) return false
    const hasParents = data.children.some((c: any) => c.childId === person.id)
    return !hasParents
  })
  
  personsWithoutParents.forEach((person: any) => {
    suggestions.push({
      type: 'parent',
      title: `Add parents for ${person.name}`,
      description: 'Complete the family tree by adding their parents',
      targetId: person.id,
      targetName: person.name
    })
  })
  
  // Find persons without siblings
  const personsWithoutSiblings = data.persons.filter((person: any) => {
    if (person.isRoot) return false
    const hasParents = data.children.some((c: any) => c.childId === person.id)
    if (!hasParents) return false
    
    // Check if they have siblings
    const parentMarriage = data.children.find((c: any) => c.childId === person.id)
    if (!parentMarriage) return false
    
    const siblings = data.children.filter((c: any) => 
      c.marriageId === parentMarriage.marriageId && c.childId !== person.id
    )
    
    return siblings.length === 0
  })
  
  personsWithoutSiblings.forEach((person: any) => {
    suggestions.push({
      type: 'sibling',
      title: `Add sibling for ${person.name}`,
      description: 'Add brothers or sisters to complete the family',
      targetId: person.id,
      targetName: person.name
    })
  })
  
  return suggestions.slice(0, 3) // Limit to 3 suggestions
}
