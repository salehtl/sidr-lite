import { createFileRoute } from '@tanstack/react-router'
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, type NodeChange, type EdgeChange, type Connection, type Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFlow } from '../contexts/FlowContext';
import { CustomNode } from '../components/CustomNode';
import { setGlobalCreateNode } from './__root';

export const Route = createFileRoute('/')({
  component: App,
})

type NodeData = {
  label: string;
  gender: 'male' | 'female';
};

type FlowNode = Node<NodeData>;

const initialNodes: FlowNode[] = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'John', gender: 'male' }, type: 'custom' },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Jane', gender: 'female' }, type: 'custom' },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];


const nodeTypes = {
  custom: CustomNode,
};

function App() {
  const { setSelectedNode } = useFlow();
  const reactFlowRef = useRef<any>(null);
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(3); // Start from 3 since we have n1 and n2
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot) as FlowNode[]),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: FlowNode) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, []);

  const createNode = useCallback((name: string, gender: 'male' | 'female') => {
    if (!reactFlowRef.current) return;
    
    // Get the center of the current viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Convert screen coordinates to flow coordinates using the ReactFlow instance
    const flowPosition = reactFlowRef.current.screenToFlowPosition({ x: centerX, y: centerY });
    
    const newNode: FlowNode = {
      id: `n${nodeIdCounter}`,
      position: flowPosition,
      data: { label: name, gender },
      type: 'custom',
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((counter) => counter + 1);
  }, [nodeIdCounter]);

  // Register the createNode function globally
  useEffect(() => {
    setGlobalCreateNode(createNode);
  }, [createNode]);

  return (
    <div 
      className="w-full h-full"
      onClick={onPaneClick}
    >
      <ReactFlow
        ref={reactFlowRef}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      />
    </div>
  );
}
