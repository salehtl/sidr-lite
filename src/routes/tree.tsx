import { createFileRoute } from '@tanstack/react-router'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from 'reactflow'
import type { Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { useMemo, useState, useEffect } from 'react'
import PersonNode from '../components/PersonNode'
import MarriageNode from '../components/MarriageNode'
import { calculateHierarchicalLayout, centerTree } from '../utils/treeLayoutEngine'
import { useTreeSync } from '../hooks/useTreeSync'
import { validateTreeNodes, getNodeValidationStatus } from '../utils/treeValidation'
import { useTreeKeyboard } from '../hooks/useTreeKeyboard'
import { useTouchGestures } from '../hooks/useTouchGestures'
import { useVirtualization } from '../hooks/useVirtualization'
import { AlertTriangle, CheckCircle, AlertCircle, Search, Activity } from 'lucide-react'

export const Route = createFileRoute('/tree')({
  component: TreeScreen,
})

const nodeTypes = {
  person: PersonNode,
  marriage: MarriageNode,
}

function TreeScreen() {
  const { data, selectPerson, isRTL } = useFamilyTreeStore()
  const [validation, setValidation] = useState(validateTreeNodes(data))
  const [showValidationPanel, setShowValidationPanel] = useState(false)
  const [, setShowSearchDialog] = useState(false)
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  
  // Update validation when data changes
  useEffect(() => {
    setValidation(validateTreeNodes(data))
  }, [data])
  
  // Convert family tree data to React Flow nodes and edges with automatic layout
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Calculate automatic layout
    const layoutNodes = calculateHierarchicalLayout(data, { isRTL })
    const centeredLayout = centerTree(layoutNodes)
    
    // Create React Flow nodes with calculated positions
    centeredLayout.forEach(layoutNode => {
      if (layoutNode.type === 'person') {
        const person = data.persons.find(p => p.id === layoutNode.id)
        if (person) {
          const validationStatus = getNodeValidationStatus(layoutNode.id, validation)
          nodes.push({
            id: layoutNode.id,
            type: 'person',
            position: { x: layoutNode.x, y: layoutNode.y },
            data: { 
              person, 
              validationStatus,
              errors: validation.nodeErrors[layoutNode.id] || []
            }
          })
        }
      } else if (layoutNode.type === 'marriage') {
        const marriageId = layoutNode.id.replace('marriage-', '')
        const marriage = data.marriages.find(m => m.id === marriageId)
        if (marriage) {
          const validationStatus = getNodeValidationStatus(layoutNode.id, validation)
          nodes.push({
            id: layoutNode.id,
            type: 'marriage',
            position: { x: layoutNode.x, y: layoutNode.y },
            data: { 
              marriage, 
              validationStatus,
              errors: validation.nodeErrors[layoutNode.id] || []
            }
          })
        }
      }
    })
    
    // Add edges between nodes with validation styling
    data.marriages.forEach(marriage => {
      const marriageNodeId = `marriage-${marriage.id}`
      const marriageValidationStatus = getNodeValidationStatus(marriageNodeId, validation)
      
      // Edges: Person -> Marriage
      edges.push({
        id: `${marriage.husbandId}-${marriageNodeId}`,
        source: marriage.husbandId,
        target: marriageNodeId,
        type: 'smoothstep',
        style: {
          stroke: marriageValidationStatus === 'error' ? '#ef4444' : 
                  marriageValidationStatus === 'warning' ? '#f59e0b' : '#6b7280',
          strokeWidth: marriageValidationStatus === 'error' ? 3 : 2
        }
      })
      
      edges.push({
        id: `${marriageNodeId}-${marriage.wifeId}`,
        source: marriageNodeId,
        target: marriage.wifeId,
        type: 'smoothstep',
        style: {
          stroke: marriageValidationStatus === 'error' ? '#ef4444' : 
                  marriageValidationStatus === 'warning' ? '#f59e0b' : '#6b7280',
          strokeWidth: marriageValidationStatus === 'error' ? 3 : 2
        }
      })
      
      // Edges: Marriage -> Children
      data.children
        .filter(child => child.marriageId === marriage.id)
        .forEach(child => {
          edges.push({
            id: `${marriageNodeId}-${child.childId}`,
            source: marriageNodeId,
            target: child.childId,
            type: 'smoothstep',
            style: {
              stroke: marriageValidationStatus === 'error' ? '#ef4444' : 
                      marriageValidationStatus === 'warning' ? '#f59e0b' : '#6b7280',
              strokeWidth: marriageValidationStatus === 'error' ? 3 : 2
            }
          })
        })
    })
    
    return { nodes, edges }
  }, [data, isRTL, validation])
  
  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes)
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges)

  // Use virtualization for performance
  const {
    getPerformanceMetrics
  } = useVirtualization(nodesState, {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    nodeWidth: 150,
    nodeHeight: 80,
    buffer: 200
  })

  // Get performance metrics for display
  const performanceMetrics = getPerformanceMetrics()
  
  // Use tree sync hook for real-time updates
  useTreeSync(setNodes, setEdges, {
    preserveViewport: true,
    animateChanges: true,
    debounceMs: 100
  })

  // Use keyboard navigation hook
  useTreeKeyboard({
    onSearch: () => setShowSearchDialog(true),
    onEdit: (nodeId) => {
      // Find the node and trigger edit mode
      const node = nodesState.find(n => n.id === nodeId)
      if (node && node.type === 'person') {
        // TODO: Trigger inline editing for person node
        console.log('Edit person:', nodeId)
      }
    },
    onDelete: (nodeId) => {
      // TODO: Show delete confirmation dialog
      console.log('Delete person:', nodeId)
    }
  })

  // Use touch gestures hook
  useTouchGestures({
    onLongPress: (event) => {
      // Show context menu or node details
      console.log('Long press detected at:', event.touches[0].clientX, event.touches[0].clientY)
    },
    onPinch: (scale, center) => {
      // Handle zoom in/out
      console.log('Pinch gesture:', scale, center)
    },
    onPan: (delta) => {
      // Handle panning
      console.log('Pan gesture:', delta)
    }
  })
  
  const onConnect = (params: Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }
  
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.type === 'person') {
      selectPerson(node.id)
    }
  }
  
  if (data.persons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Family Tree</h1>
          <p className="text-gray-600 mb-4">Start by adding people to your family tree</p>
          <a
            href="/quick-entry"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Person
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen w-full relative">
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setShowSearchDialog(true)}
          className="bg-white rounded-lg shadow-lg border p-2 hover:bg-gray-50 transition-colors"
          title="Search persons (Ctrl+F)"
        >
          <Search className="text-blue-600" size={20} />
        </button>
        
        <button
          onClick={() => setShowPerformancePanel(!showPerformancePanel)}
          className="bg-white rounded-lg shadow-lg border p-2 hover:bg-gray-50 transition-colors"
          title="Performance metrics"
        >
          <Activity className="text-purple-600" size={20} />
        </button>
        
        <button
          onClick={() => setShowValidationPanel(!showValidationPanel)}
          className="bg-white rounded-lg shadow-lg border p-2 hover:bg-gray-50 transition-colors"
          title="Toggle validation panel"
        >
          {validation.isValid ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <AlertTriangle className="text-red-600" size={20} />
          )}
        </button>
      </div>
      
      {/* Validation Panel */}
      {showValidationPanel && (
        <div className="absolute top-4 right-16 z-10 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Tree Validation</h3>
            <button
              onClick={() => setShowValidationPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          {validation.isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm">All validations passed</span>
            </div>
          ) : (
            <div className="space-y-2">
              {validation.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Errors ({validation.errors.length})</span>
                  </div>
                  <ul className="text-xs text-red-600 space-y-1 ml-6">
                    {validation.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {validation.errors.length > 3 && (
                      <li>• ... and {validation.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {validation.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-yellow-600 mb-1">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">Warnings ({validation.warnings.length})</span>
                  </div>
                  <ul className="text-xs text-yellow-600 space-y-1 ml-6">
                    {validation.warnings.slice(0, 2).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                    {validation.warnings.length > 2 && (
                      <li>• ... and {validation.warnings.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Performance Panel */}
      {showPerformancePanel && (
        <div className="absolute top-4 right-16 z-10 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            <button
              onClick={() => setShowPerformancePanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Nodes:</span>
              <span className="font-medium">{performanceMetrics.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Visible Nodes:</span>
              <span className="font-medium text-green-600">{performanceMetrics.visible}</span>
            </div>
            <div className="flex justify-between">
              <span>Buffered Nodes:</span>
              <span className="font-medium text-blue-600">{performanceMetrics.buffered}</span>
            </div>
            <div className="flex justify-between">
              <span>Hidden Nodes:</span>
              <span className="font-medium text-gray-500">{performanceMetrics.hidden}</span>
            </div>
            <div className="flex justify-between">
              <span>Render Ratio:</span>
              <span className="font-medium text-purple-600">
                {(performanceMetrics.renderRatio * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="h-full">
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
