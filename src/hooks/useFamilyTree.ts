import { useState, useCallback, useMemo } from 'react'
import { useNodesState, useEdgesState, addEdge as addReactFlowEdge } from 'reactflow'
import type { Node, Edge, Connection } from 'reactflow'
import type { PersonData, LinkKind, TreeNode, TreeEdge } from '../types'
import { edgeStyleByType } from '../utils/constants'

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function useFamilyTree(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [linkType, setLinkType] = useState<LinkKind>('descendant')

  const selectedNodes = useMemo(() => 
    nodes.filter((n) => selectedNodeIds.has(n.id)), 
    [nodes, selectedNodeIds]
  )

  const selectedNode = useMemo(() => 
    selectedNodes.length === 1 ? selectedNodes[0] : undefined,
    [selectedNodes]
  )

  const addNode = useCallback((position: { x: number; y: number }, data?: Partial<PersonData>) => {
    const newNode: Node = {
      id: generateId(),
      type: 'person',
      position,
      data: {
        name: data?.name || 'New Person',
        gender: data?.gender || 'M',
        dob: data?.dob,
        dod: data?.dod
      }
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeIds(new Set([newNode.id]))
    return newNode
  }, [setNodes])

  const updateNode = useCallback((nodeId: string, patch: Partial<PersonData>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    )
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      next.delete(nodeId)
      return next
    })
  }, [setEdges, setNodes])

  const addEdge = useCallback((connection: Connection, overrideLinkType?: LinkKind) => {
    if (!connection.source || !connection.target) return
    const edgeLinkType = overrideLinkType || linkType
    const { style, markerEnd, label } = edgeStyleByType[edgeLinkType]
    const newEdge: Edge = {
      id: generateId(),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      data: { type: edgeLinkType },
      label,
      style,
      markerEnd,
      animated: edgeLinkType === 'descendant'
    }
    setEdges((eds) => addReactFlowEdge(newEdge, eds))
  }, [linkType, setEdges])

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
  }, [setEdges])

  const loadTree = useCallback((treeNodes: TreeNode[], treeEdges: TreeEdge[]) => {
    setNodes(treeNodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data
    })))
    setEdges(treeEdges.map(e => {
      const { style, markerEnd, label } = edgeStyleByType[e.data.type]
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
        label: e.label || label,
        style,
        markerEnd,
        animated: e.data.type === 'descendant'
      }
    }))
    setSelectedNodeIds(new Set())
  }, [setNodes, setEdges])

  const setSelectedNodeId = useCallback((nodeId: string | undefined) => {
    setSelectedNodeIds(nodeId ? new Set([nodeId]) : new Set())
  }, [])

  const toggleNodeSelection = useCallback((nodeId: string, multiSelect: boolean = false) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      if (multiSelect) {
        // Multi-select: toggle this node
        if (next.has(nodeId)) {
          next.delete(nodeId)
        } else {
          next.add(nodeId)
        }
      } else {
        // Single select: replace selection
        next.clear()
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set())
  }, [])

  return {
    nodes,
    edges,
    selectedNodeIds,
    selectedNodes,
    selectedNode,
    linkType,
    setLinkType,
    setSelectedNodeId,
    toggleNodeSelection,
    clearSelection,
    onNodesChange,
    onEdgesChange,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    loadTree
  }
}

