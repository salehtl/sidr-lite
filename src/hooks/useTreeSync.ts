import { useEffect, useCallback, useRef } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { calculateHierarchicalLayout, centerTree } from '../utils/treeLayoutEngine'
import type { Node, Edge } from 'reactflow'

export interface TreeSyncOptions {
  preserveViewport?: boolean
  animateChanges?: boolean
  debounceMs?: number
}

export function useTreeSync(
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  options: TreeSyncOptions = {}
) {
  const {
    debounceMs = 100
  } = options
  
  const { data, isRTL } = useFamilyTreeStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef(data)
  
  const syncTree = useCallback(() => {
    // Calculate new layout
    const layoutNodes = calculateHierarchicalLayout(data, { isRTL })
    const centeredLayout = centerTree(layoutNodes)
    
    // Convert to React Flow nodes
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Create person and marriage nodes
    centeredLayout.forEach(layoutNode => {
      if (layoutNode.type === 'person') {
        const person = data.persons.find(p => p.id === layoutNode.id)
        if (person) {
          nodes.push({
            id: layoutNode.id,
            type: 'person',
            position: { x: layoutNode.x, y: layoutNode.y },
            data: { person }
          })
        }
      } else if (layoutNode.type === 'marriage') {
        const marriageId = layoutNode.id.replace('marriage-', '')
        const marriage = data.marriages.find(m => m.id === marriageId)
        if (marriage) {
          nodes.push({
            id: layoutNode.id,
            type: 'marriage',
            position: { x: layoutNode.x, y: layoutNode.y },
            data: { marriage }
          })
        }
      }
    })
    
    // Create edges
    data.marriages.forEach(marriage => {
      const marriageNodeId = `marriage-${marriage.id}`
      
      // Person -> Marriage edges
      if (marriage.husbandId) {
        edges.push({
          id: `${marriage.husbandId}-${marriageNodeId}`,
          source: marriage.husbandId,
          target: marriageNodeId,
          type: 'smoothstep'
        })
      }
      
      if (marriage.wifeId) {
        edges.push({
          id: `${marriageNodeId}-${marriage.wifeId}`,
          source: marriageNodeId,
          target: marriage.wifeId,
          type: 'smoothstep'
        })
      }
      
      // Marriage -> Children edges
      data.children
        .filter(child => child.marriageId === marriage.id)
        .forEach(child => {
          edges.push({
            id: `${marriageNodeId}-${child.childId}`,
            source: marriageNodeId,
            target: child.childId,
            type: 'smoothstep'
          })
        })
    })
    
    // Update nodes and edges
    setNodes(nodes)
    setEdges(edges)
    
    // Store current data for comparison
    lastDataRef.current = data
  }, [data, isRTL, setNodes, setEdges])
  
  // Debounced sync to prevent excessive updates
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      syncTree()
    }, debounceMs)
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [syncTree, debounceMs])
  
  // Immediate sync for critical changes
  useEffect(() => {
    const hasStructuralChanges = 
      data.persons.length !== lastDataRef.current.persons.length ||
      data.marriages.length !== lastDataRef.current.marriages.length ||
      data.children.length !== lastDataRef.current.children.length
    
    if (hasStructuralChanges) {
      syncTree()
    }
  }, [data.persons.length, data.marriages.length, data.children.length, syncTree])
  
  return {
    syncTree,
    isSyncing: false // Could be enhanced to track actual sync state
  }
}
