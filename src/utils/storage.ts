import type { FamilyTree } from '../types/domain'

const STORAGE_KEY = 'family-tree-data'
const DEFAULT_DATA: FamilyTree = {
  version: 1,
  persons: [],
  marriages: [],
  children: []
}

export function loadFromStorage(): FamilyTree {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_DATA
    }
    
    const data = JSON.parse(stored) as FamilyTree
    
    // Basic validation
    if (!data.version || !Array.isArray(data.persons) || !Array.isArray(data.marriages) || !Array.isArray(data.children)) {
      console.warn('Invalid stored data, using defaults')
      return DEFAULT_DATA
    }
    
    return data
  } catch (error) {
    console.error('Failed to load from storage:', error)
    return DEFAULT_DATA
  }
}

export function saveToStorage(data: FamilyTree): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to storage:', error)
    throw new Error('Failed to save data to storage')
  }
}

export function exportToJSON(data: FamilyTree): string {
  return JSON.stringify(data, null, 2)
}

export function importFromJSON(jsonString: string): FamilyTree {
  try {
    const data = JSON.parse(jsonString) as FamilyTree
    
    // Basic validation
    if (!data.version || !Array.isArray(data.persons) || !Array.isArray(data.marriages) || !Array.isArray(data.children)) {
      throw new Error('Invalid JSON format')
    }
    
    return data
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    throw new Error('Invalid JSON format')
  }
}

export function downloadJSON(data: FamilyTree, filename: string = 'family-tree.json'): void {
  const jsonString = exportToJSON(data)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function uploadJSON(): Promise<FamilyTree> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string
          const data = importFromJSON(jsonString)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    
    input.click()
  })
}
