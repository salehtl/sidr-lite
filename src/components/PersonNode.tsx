import { memo, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import type { PersonData } from '../types'

interface PersonNodeProps {
  data: PersonData
  selected: boolean
  id: string
  onLongPress?: (nodeId: string) => void
}

export const PersonNode = memo(function PersonNode({ data, selected, id, onLongPress }: PersonNodeProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>()
  const touchStartTime = useRef<number>()
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartTime.current = Date.now()
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        // Only trigger long-press if finger hasn't moved much
        if (touchStartPos.current) {
          onLongPress?.(id)
        }
      }, 500)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long-press if user moves finger
    if (touchStartPos.current && longPressTimer.current) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
      
      if (deltaX > 10 || deltaY > 10) {
        // User is dragging, cancel long-press
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = undefined
        }
        touchStartPos.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
    
    touchStartTime.current = undefined
    touchStartPos.current = null
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <div
      className={[
        'rounded-2xl shadow-sm border min-w-[160px] max-w-[220px] bg-white relative',
        selected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-neutral-200'
      ].join(' ')}
      style={{ contain: 'layout style paint' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Connection handles on all sides - source handles for outgoing connections */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!bg-sky-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-sky-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ right: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!bg-sky-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ bottom: -6 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!bg-sky-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ left: -6 }}
      />
      {/* Target handles for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!bg-rose-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ top: -6 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!bg-rose-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!bg-rose-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ bottom: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-rose-500 !border-2 !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        style={{ left: -6 }}
      />

      <div className="flex items-center justify-between px-3 py-2 border-b text-sm">
        <div className="font-medium truncate" title={data.name}>
          {data.name || 'Unnamed'}
        </div>
        <span
          className={
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs border ' +
            (data.gender === 'M'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-rose-50 text-rose-700 border-rose-200')
          }
        >
          {data.gender}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-neutral-600 grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="text-neutral-400">DoB</div>
        <div className="truncate" title={data.dob}>
          {data.dob || '—'}
        </div>
        <div className="text-neutral-400">DoD</div>
        <div className="truncate" title={data.dod}>
          {data.dod || '—'}
        </div>
      </div>
    </div>
  )
})

