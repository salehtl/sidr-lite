import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'

import Header from '../components/Header'
import useFamilyTreeStore from '../store/familyTreeStore'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { setRTL, isRTL } = useFamilyTreeStore()
  
  useEffect(() => {
    // Initialize RTL state from localStorage
    const savedRTL = localStorage.getItem('family-tree-rtl')
    if (savedRTL) {
      setRTL(savedRTL === 'true')
    }
  }, [setRTL])
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <Outlet />
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
    </div>
  )
}
