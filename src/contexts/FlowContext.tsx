import { createContext, useContext, useState, ReactNode } from 'react'

type NodeData = {
  label: string;
  gender: 'male' | 'female';
};

type FlowNode = {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
};

interface FlowContextType {
  selectedNode: FlowNode | null;
  setSelectedNode: (node: FlowNode | null) => void;
  createNode: (name: string, gender: 'male' | 'female') => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

interface FlowProviderProps {
  children: ReactNode;
  createNode: (name: string, gender: 'male' | 'female') => void;
}

export function FlowProvider({ children, createNode }: FlowProviderProps) {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  return (
    <FlowContext.Provider value={{
      selectedNode,
      setSelectedNode,
      createNode,
    }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}
