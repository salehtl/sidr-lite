import { useState, useCallback } from 'react'
import { FlowProvider } from '../contexts/FlowContext'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { AppSidebar } from '../components/AppSidebar'
import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

type NodeData = {
  label: string;
  gender: 'male' | 'female';
};

type FlowNode = {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
};

export function AppWrapper() {
  const [nodeIdCounter, setNodeIdCounter] = useState(3);
  const [nodes, setNodes] = useState<FlowNode[]>([]);

  const createNode = useCallback((name: string, gender: 'male' | 'female') => {
    // Create a node at a random position near the center
    const x = 150 + Math.random() * 200;
    const y = 150 + Math.random() * 200;
    
    const newNode: FlowNode = {
      id: `n${nodeIdCounter}`,
      position: { x, y },
      data: { label: name, gender },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((counter) => counter + 1);
  }, [nodeIdCounter]);

  return (
    <FlowProvider createNode={createNode}>
      <div className="h-screen overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="h-screen">
            <Outlet />
          </SidebarInset>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </SidebarProvider>
      </div>
    </FlowProvider>
  );
}
