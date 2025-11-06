import { useCallback, useEffect, useState, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type NodeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'
import { PersonNode } from './components/PersonNode'
import { NodeEditor } from './components/NodeEditor'
import { Toolbar } from './components/Toolbar'
import { useFamilyTree } from './hooks/useFamilyTree'
import { useIndexedDB } from './hooks/useIndexedDB'
import { useAutoSave } from './hooks/useAutoSave'
import { useMobile } from './hooks/useMobile'
import { getSmartHandles } from './utils/connection'
import type { PersonData } from './types'

function createNodeTypes(onLongPress?: (nodeId: string) => void): NodeTypes {
  return {
    person: (props: any) => <PersonNode {...props} onLongPress={onLongPress} />
  }
}

function Editor() {
  const isMobile = useMobile()
  const { screenToFlowPosition } = useReactFlow()
  const db = useIndexedDB()
  const [isLoading, setIsLoading] = useState(true)
  const [linkSourceNodeId, setLinkSourceNodeId] = useState<string | null>(null)

  const {
    nodes,
    edges,
    selectedNodeIds,
    selectedNodes,
    linkType,
    setLinkType,
    toggleNodeSelection,
    clearSelection,
    onNodesChange,
    onEdgesChange,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    loadTree
  } = useFamilyTree()

  // Load tree from IndexedDB on mount
  useEffect(() => {
    if (!db.isReady) return

    db.loadTree()
      .then((data) => {
        if (data) {
          loadTree(data.nodes, data.edges)
        } else {
          // Create initial node if no data exists
          addNode({ x: 100, y: 100 }, { name: 'Root', gender: 'M' })
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load tree:', err)
        setIsLoading(false)
      })
  }, [db.isReady, loadTree, addNode])


  // Auto-save
  useAutoSave(
    nodes.map((n) => ({ id: n.id, type: 'person' as const, position: n.position, data: n.data as PersonData })),
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data, label: typeof e.label === 'string' ? e.label : undefined })),
    db.isReady && !isLoading
  )

  const handlePaneClick = useCallback(
    (evt: React.MouseEvent | React.TouchEvent) => {
      if (linkSourceNodeId) {
        // Cancel link creation
        setLinkSourceNodeId(null)
        return
      }

      // Deselect all nodes when clicking on pane
      if (selectedNodeIds.size > 0) {
        clearSelection()
      }

      const clientX = 'touches' in evt ? evt.touches[0].clientX : evt.clientX
      const clientY = 'touches' in evt ? evt.touches[0].clientY : evt.clientY
      const pos = screenToFlowPosition({ x: clientX, y: clientY })
      addNode(pos)
    },
    [linkSourceNodeId, selectedNodeIds.size, screenToFlowPosition, addNode, clearSelection]
  )

  const handleNodeClick = useCallback(
    (evt: React.MouseEvent, node: any) => {
      if (linkSourceNodeId) {
        // Complete link creation
        if (linkSourceNodeId !== node.id) {
          const sourceNode = nodes.find((n) => n.id === linkSourceNodeId)
          const targetNode = nodes.find((n) => n.id === node.id)
          
          if (sourceNode && targetNode) {
            const { sourceHandle, targetHandle } = getSmartHandles(sourceNode, targetNode)
            addEdge({ 
              source: linkSourceNodeId, 
              target: node.id, 
              sourceHandle, 
              targetHandle 
            })
          }
        }
        setLinkSourceNodeId(null)
        toggleNodeSelection(node.id, false)
      } else {
        // Check for CMD/Ctrl key for multi-select
        const isMultiSelect = evt.metaKey || evt.ctrlKey
        toggleNodeSelection(node.id, isMultiSelect)
      }
    },
    [linkSourceNodeId, addEdge, toggleNodeSelection, nodes]
  )

  const handleSelectionChange = useCallback(
    ({ nodes: rfSelectedNodes }: { nodes: any[] }) => {
      // Sync ReactFlow's selection with our state
      const rfSelectedIds = new Set(rfSelectedNodes.map((n: any) => n.id))
      const currentIds = selectedNodeIds
      
      // Only update if different
      if (rfSelectedIds.size !== currentIds.size || 
          !Array.from(rfSelectedIds).every(id => currentIds.has(id))) {
        // ReactFlow handles selection, we just sync
        // But we don't want to override our own selection logic
        // So we'll let ReactFlow's selection be the source of truth for visual feedback
      }
    },
    [selectedNodeIds]
  )

  // Handle ESC key to deselect all
  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection])

  const handleNodeLongPress = useCallback(
    (nodeId: string) => {
      if (confirm('Delete this node?')) {
        deleteNode(nodeId)
      }
    },
    [deleteNode]
  )

  const nodeTypes = useMemo(() => createNodeTypes(isMobile ? handleNodeLongPress : undefined), [isMobile, handleNodeLongPress])

  const handleNodeContextMenu = useCallback(
    (_evt: React.MouseEvent, node: any) => {
      _evt.preventDefault()
      if (confirm('Delete this node?')) {
        deleteNode(node.id)
      }
    },
    [deleteNode]
  )


  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return

      // Find source and target nodes
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) return

      // Get smart handle positions based on node placement
      const { sourceHandle, targetHandle } = getSmartHandles(
        sourceNode,
        targetNode,
        connection
      )

      // Create connection with smart handles
      addEdge({
        ...connection,
        sourceHandle,
        targetHandle
      })
    },
    [addEdge, nodes]
  )

  const handleUpdateNode = useCallback(
    (patch: Partial<PersonData>) => {
      // Update all selected nodes
      selectedNodeIds.forEach((nodeId) => {
        updateNode(nodeId, patch)
      })
    },
    [selectedNodeIds, updateNode]
  )

  const handleDeleteNode = useCallback(() => {
    // Delete all selected nodes
    selectedNodeIds.forEach((nodeId) => {
      deleteNode(nodeId)
    })
    clearSelection()
  }, [selectedNodeIds, deleteNode, clearSelection])

  const handleCreateMarriage = useCallback(() => {
    if (selectedNodes.length === 2) {
      const [node1, node2] = selectedNodes
      const data1 = node1.data as PersonData
      const data2 = node2.data as PersonData
      
      // Check if genders are different
      if (data1.gender !== data2.gender) {
        // Get smart handle positions
        const { sourceHandle, targetHandle } = getSmartHandles(node1, node2)
        // Create marriage edge directly with override
        addEdge({ 
          source: node1.id, 
          target: node2.id, 
          sourceHandle, 
          targetHandle 
        }, 'marriage')
      }
    }
  }, [selectedNodes, addEdge])

  const handleTreeLoad = useCallback(
    (loadedNodes: any[], loadedEdges: any[]) => {
      loadTree(loadedNodes, loadedEdges)
    },
    [loadTree]
  )

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-neutral-50 text-neutral-900 flex flex-col">
      <Toolbar
        linkType={linkType}
        onLinkTypeChange={setLinkType}
        nodes={nodes}
        edges={edges}
        onTreeLoad={handleTreeLoad}
      />
      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes.map((n) => ({ ...n, selected: selectedNodeIds.has(n.id) }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onPaneClick={handlePaneClick}
            onNodeClick={handleNodeClick}
            onSelectionChange={handleSelectionChange}
            onNodeContextMenu={handleNodeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            connectionLineStyle={{ strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable
            nodesConnectable
            elementsSelectable
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            preventScrolling={isMobile}
          >
            <Background gap={16} size={1} />
            {!isMobile && <MiniMap pannable zoomable />}
            <Controls />
          </ReactFlow>
        </div>
        {!isMobile && (
          <div className="w-80 border-l">
            <NodeEditor
              selectedNodes={selectedNodes.map((n) => ({ id: n.id, data: n.data as PersonData }))}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
              onCreateMarriage={selectedNodes.length === 2 ? handleCreateMarriage : undefined}
              onClose={clearSelection}
            />
          </div>
        )}
      </div>
      {isMobile && selectedNodes.length > 0 && (
        <NodeEditor
          selectedNodes={selectedNodes.map((n) => ({ id: n.id, data: n.data as PersonData }))}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
          onCreateMarriage={selectedNodes.length === 2 ? handleCreateMarriage : undefined}
          onClose={clearSelection}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}

