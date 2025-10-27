import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { AppSidebar } from '../components/AppSidebar'
import { FlowProvider } from '../contexts/FlowContext'

// Global createNode function that will be set by the main component
let globalCreateNode: ((name: string, gender: 'male' | 'female') => void) | null = null;

export const setGlobalCreateNode = (fn: (name: string, gender: 'male' | 'female') => void) => {
  globalCreateNode = fn;
};

export const Route = createRootRoute({
  component: () => {
    const createNode = (name: string, gender: 'male' | 'female') => {
      if (globalCreateNode) {
        globalCreateNode(name, gender);
      } else {
        console.log('CreateNode not yet available:', name, gender);
      }
    };

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
  },
})
