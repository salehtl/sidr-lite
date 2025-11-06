import { MarkerType } from 'reactflow'
import type { LinkKind } from '../types'

export const edgeStyleByType: Record<LinkKind, { style?: React.CSSProperties; markerEnd?: any; label?: string }> = {
  descendant: {
    style: { strokeDasharray: '0', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'descendant'
  },
  marriage: {
    style: { strokeDasharray: '4 2', strokeWidth: 2 },
    label: 'marriage'
  },
  divorced: {
    style: { strokeDasharray: '2 4', strokeWidth: 2 },
    label: 'divorced'
  },
  widowed: {
    style: { strokeDasharray: '1 3', strokeWidth: 2 },
    label: 'widowed'
  }
}

