import { useState, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export function useWarningTiming() {
  const { data } = useFamilyTreeStore()
  const [lastEditTime, setLastEditTime] = useState<Date>(new Date())
  const [isActivelyCreating, setIsActivelyCreating] = useState(false)
  
  // Track when data changes (user is actively editing)
  useEffect(() => {
    setLastEditTime(new Date())
    setIsActivelyCreating(true)
    
    // Set a timer to mark as not actively creating after 2 minutes of inactivity
    const timer = setTimeout(() => {
      setIsActivelyCreating(false)
    }, 2 * 60 * 1000) // 2 minutes
    
    return () => clearTimeout(timer)
  }, [data.persons.length, data.marriages.length, data.children.length])
  
  // Determine if we should suppress warnings
  const shouldSuppressWarnings = () => {
    // Suppress if tree is small (still building)
    if (data.persons.length < 5) {
      return true
    }
    
    // Suppress if actively creating (last edit was recent)
    const timeSinceLastEdit = Date.now() - lastEditTime.getTime()
    const twoMinutes = 2 * 60 * 1000
    
    if (timeSinceLastEdit < twoMinutes) {
      return true
    }
    
    return false
  }
  
  return {
    shouldSuppressWarnings: shouldSuppressWarnings(),
    isActivelyCreating,
    lastEditTime
  }
}
