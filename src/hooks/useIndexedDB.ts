import { useEffect, useState } from 'react'
import { loadTree, saveTree, clearTree } from '../utils/storage'

export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  return {
    isReady,
    loadTree,
    saveTree,
    clearTree
  }
}

