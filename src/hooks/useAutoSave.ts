import { useEffect, useRef } from 'react'
import { saveTree } from '../utils/storage'
import type { TreeNode, TreeEdge } from '../types'

export function useAutoSave(
  nodes: TreeNode[],
  edges: TreeEdge[],
  enabled: boolean = true,
  delay: number = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveTree(nodes, edges).catch(console.error)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes, edges, enabled, delay])
}

