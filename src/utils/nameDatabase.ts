// Common names database for autocomplete suggestions
// Organized by gender and cultural background

export interface NameSuggestion {
  name: string
  gender: 'M' | 'F'
  culture?: string
  popularity: number // 1-10 scale
}

// Common names by gender
const COMMON_NAMES: NameSuggestion[] = [
  // Male names
  { name: 'John', gender: 'M', culture: 'English', popularity: 10 },
  { name: 'Michael', gender: 'M', culture: 'English', popularity: 9 },
  { name: 'David', gender: 'M', culture: 'English', popularity: 9 },
  { name: 'James', gender: 'M', culture: 'English', popularity: 8 },
  { name: 'Robert', gender: 'M', culture: 'English', popularity: 8 },
  { name: 'William', gender: 'M', culture: 'English', popularity: 8 },
  { name: 'Richard', gender: 'M', culture: 'English', popularity: 7 },
  { name: 'Thomas', gender: 'M', culture: 'English', popularity: 7 },
  { name: 'Christopher', gender: 'M', culture: 'English', popularity: 7 },
  { name: 'Daniel', gender: 'M', culture: 'English', popularity: 7 },
  { name: 'Matthew', gender: 'M', culture: 'English', popularity: 6 },
  { name: 'Anthony', gender: 'M', culture: 'English', popularity: 6 },
  { name: 'Mark', gender: 'M', culture: 'English', popularity: 6 },
  { name: 'Donald', gender: 'M', culture: 'English', popularity: 6 },
  { name: 'Steven', gender: 'M', culture: 'English', popularity: 5 },
  { name: 'Paul', gender: 'M', culture: 'English', popularity: 5 },
  { name: 'Andrew', gender: 'M', culture: 'English', popularity: 5 },
  { name: 'Joshua', gender: 'M', culture: 'English', popularity: 5 },
  { name: 'Kenneth', gender: 'M', culture: 'English', popularity: 5 },
  { name: 'Kevin', gender: 'M', culture: 'English', popularity: 5 },
  
  // Female names
  { name: 'Mary', gender: 'F', culture: 'English', popularity: 10 },
  { name: 'Patricia', gender: 'F', culture: 'English', popularity: 9 },
  { name: 'Jennifer', gender: 'F', culture: 'English', popularity: 9 },
  { name: 'Linda', gender: 'F', culture: 'English', popularity: 8 },
  { name: 'Elizabeth', gender: 'F', culture: 'English', popularity: 8 },
  { name: 'Barbara', gender: 'F', culture: 'English', popularity: 8 },
  { name: 'Susan', gender: 'F', culture: 'English', popularity: 7 },
  { name: 'Jessica', gender: 'F', culture: 'English', popularity: 7 },
  { name: 'Sarah', gender: 'F', culture: 'English', popularity: 7 },
  { name: 'Karen', gender: 'F', culture: 'English', popularity: 7 },
  { name: 'Nancy', gender: 'F', culture: 'English', popularity: 6 },
  { name: 'Lisa', gender: 'F', culture: 'English', popularity: 6 },
  { name: 'Betty', gender: 'F', culture: 'English', popularity: 6 },
  { name: 'Helen', gender: 'F', culture: 'English', popularity: 6 },
  { name: 'Sandra', gender: 'F', culture: 'English', popularity: 5 },
  { name: 'Donna', gender: 'F', culture: 'English', popularity: 5 },
  { name: 'Carol', gender: 'F', culture: 'English', popularity: 5 },
  { name: 'Ruth', gender: 'F', culture: 'English', popularity: 5 },
  { name: 'Sharon', gender: 'F', culture: 'English', popularity: 5 },
  { name: 'Michelle', gender: 'F', culture: 'English', popularity: 5 },

  // Arabic/Middle Eastern names
  { name: 'Mohammed', gender: 'M', culture: 'Arabic', popularity: 10 },
  { name: 'Ahmed', gender: 'M', culture: 'Arabic', popularity: 9 },
  { name: 'Ali', gender: 'M', culture: 'Arabic', popularity: 8 },
  { name: 'Omar', gender: 'M', culture: 'Arabic', popularity: 8 },
  { name: 'Hassan', gender: 'M', culture: 'Arabic', popularity: 7 },
  { name: 'Ibrahim', gender: 'M', culture: 'Arabic', popularity: 7 },
  { name: 'Yusuf', gender: 'M', culture: 'Arabic', popularity: 6 },
  { name: 'Khalid', gender: 'M', culture: 'Arabic', popularity: 6 },
  { name: 'Abdullah', gender: 'M', culture: 'Arabic', popularity: 6 },
  { name: 'Saeed', gender: 'M', culture: 'Arabic', popularity: 5 },
  
  { name: 'Fatima', gender: 'F', culture: 'Arabic', popularity: 10 },
  { name: 'Aisha', gender: 'F', culture: 'Arabic', popularity: 9 },
  { name: 'Khadija', gender: 'F', culture: 'Arabic', popularity: 8 },
  { name: 'Zainab', gender: 'F', culture: 'Arabic', popularity: 8 },
  { name: 'Mariam', gender: 'F', culture: 'Arabic', popularity: 7 },
  { name: 'Amina', gender: 'F', culture: 'Arabic', popularity: 7 },
  { name: 'Hafsa', gender: 'F', culture: 'Arabic', popularity: 6 },
  { name: 'Safiya', gender: 'F', culture: 'Arabic', popularity: 6 },
  { name: 'Ruqayya', gender: 'F', culture: 'Arabic', popularity: 5 },
  { name: 'Umm Kulthum', gender: 'F', culture: 'Arabic', popularity: 5 },

  // Spanish/Latino names
  { name: 'Carlos', gender: 'M', culture: 'Spanish', popularity: 9 },
  { name: 'Jose', gender: 'M', culture: 'Spanish', popularity: 9 },
  { name: 'Luis', gender: 'M', culture: 'Spanish', popularity: 8 },
  { name: 'Antonio', gender: 'M', culture: 'Spanish', popularity: 8 },
  { name: 'Francisco', gender: 'M', culture: 'Spanish', popularity: 7 },
  { name: 'Manuel', gender: 'M', culture: 'Spanish', popularity: 7 },
  { name: 'Juan', gender: 'M', culture: 'Spanish', popularity: 7 },
  { name: 'Pedro', gender: 'M', culture: 'Spanish', popularity: 6 },
  { name: 'Miguel', gender: 'M', culture: 'Spanish', popularity: 6 },
  { name: 'Rafael', gender: 'M', culture: 'Spanish', popularity: 5 },
  
  { name: 'Maria', gender: 'F', culture: 'Spanish', popularity: 10 },
  { name: 'Carmen', gender: 'F', culture: 'Spanish', popularity: 8 },
  { name: 'Ana', gender: 'F', culture: 'Spanish', popularity: 8 },
  { name: 'Isabel', gender: 'F', culture: 'Spanish', popularity: 7 },
  { name: 'Rosa', gender: 'F', culture: 'Spanish', popularity: 7 },
  { name: 'Elena', gender: 'F', culture: 'Spanish', popularity: 6 },
  { name: 'Teresa', gender: 'F', culture: 'Spanish', popularity: 6 },
  { name: 'Cristina', gender: 'F', culture: 'Spanish', popularity: 5 },
  { name: 'Monica', gender: 'F', culture: 'Spanish', popularity: 5 },
  { name: 'Patricia', gender: 'F', culture: 'Spanish', popularity: 5 },

  // Asian names
  { name: 'Wei', gender: 'M', culture: 'Chinese', popularity: 8 },
  { name: 'Ming', gender: 'M', culture: 'Chinese', popularity: 7 },
  { name: 'Jian', gender: 'M', culture: 'Chinese', popularity: 7 },
  { name: 'Hao', gender: 'M', culture: 'Chinese', popularity: 6 },
  { name: 'Feng', gender: 'M', culture: 'Chinese', popularity: 6 },
  
  { name: 'Li', gender: 'F', culture: 'Chinese', popularity: 8 },
  { name: 'Mei', gender: 'F', culture: 'Chinese', popularity: 7 },
  { name: 'Xia', gender: 'F', culture: 'Chinese', popularity: 6 },
  { name: 'Yan', gender: 'F', culture: 'Chinese', popularity: 6 },
  { name: 'Hui', gender: 'F', culture: 'Chinese', popularity: 5 },

  // Indian names
  { name: 'Raj', gender: 'M', culture: 'Indian', popularity: 8 },
  { name: 'Kumar', gender: 'M', culture: 'Indian', popularity: 7 },
  { name: 'Vikram', gender: 'M', culture: 'Indian', popularity: 6 },
  { name: 'Arjun', gender: 'M', culture: 'Indian', popularity: 6 },
  { name: 'Suresh', gender: 'M', culture: 'Indian', popularity: 5 },
  
  { name: 'Priya', gender: 'F', culture: 'Indian', popularity: 8 },
  { name: 'Kavita', gender: 'F', culture: 'Indian', popularity: 7 },
  { name: 'Sunita', gender: 'F', culture: 'Indian', popularity: 6 },
  { name: 'Meera', gender: 'F', culture: 'Indian', popularity: 6 },
  { name: 'Anita', gender: 'F', culture: 'Indian', popularity: 5 }
]

// User's learned names (stored in localStorage)
const LEARNED_NAMES_KEY = 'family-tree-learned-names'

export function getLearnedNames(): NameSuggestion[] {
  try {
    const stored = localStorage.getItem(LEARNED_NAMES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addLearnedName(name: string, gender: 'M' | 'F') {
  try {
    const learned = getLearnedNames()
    const existing = learned.find(n => n.name.toLowerCase() === name.toLowerCase())
    
    if (!existing) {
      const newName: NameSuggestion = {
        name,
        gender,
        popularity: 5, // Medium popularity for learned names
        culture: 'Learned'
      }
      learned.push(newName)
      localStorage.setItem(LEARNED_NAMES_KEY, JSON.stringify(learned))
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function getSuggestions(query: string, gender?: 'M' | 'F', limit: number = 10): NameSuggestion[] {
  if (!query.trim()) return []
  
  const learnedNames = getLearnedNames()
  const allNames = [...COMMON_NAMES, ...learnedNames]
  
  // Filter by gender if specified
  const filteredNames = gender 
    ? allNames.filter(n => n.gender === gender)
    : allNames
  
  // Filter by query (case-insensitive)
  const matchingNames = filteredNames.filter(n => 
    n.name.toLowerCase().includes(query.toLowerCase())
  )
  
  // Sort by popularity and relevance
  const sortedNames = matchingNames.sort((a, b) => {
    // First by popularity
    if (a.popularity !== b.popularity) {
      return b.popularity - a.popularity
    }
    
    // Then by exact match vs partial match
    const aExact = a.name.toLowerCase().startsWith(query.toLowerCase())
    const bExact = b.name.toLowerCase().startsWith(query.toLowerCase())
    
    if (aExact !== bExact) {
      return aExact ? -1 : 1
    }
    
    // Finally by name length (shorter names first)
    return a.name.length - b.name.length
  })
  
  return sortedNames.slice(0, limit)
}

export function getCulturalSuggestions(existingNames: string[], limit: number = 5): NameSuggestion[] {
  if (existingNames.length === 0) return []
  
  // Analyze existing names to determine cultural background
  const culturalHints = existingNames.map(name => {
    const suggestion = COMMON_NAMES.find(n => 
      n.name.toLowerCase() === name.toLowerCase()
    )
    return suggestion?.culture
  }).filter(Boolean)
  
  // Find most common culture
  const cultureCounts = culturalHints.reduce((acc, culture) => {
    acc[culture!] = (acc[culture!] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const dominantCulture = Object.entries(cultureCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  if (!dominantCulture) return []
  
  // Return names from the same culture
  return COMMON_NAMES
    .filter(n => n.culture === dominantCulture)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}
