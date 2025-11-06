import { useCallback, useMemo } from 'react'
import type { PersonData, Gender } from '../types'
import { useMobile } from '../hooks/useMobile'

interface NodeEditorProps {
  selectedNodes: { id: string; data: PersonData }[]
  onUpdate: (patch: Partial<PersonData>) => void
  onDelete: () => void
  onCreateMarriage?: () => void
  onClose: () => void
}

export function NodeEditor({ selectedNodes, onUpdate, onDelete, onCreateMarriage, onClose }: NodeEditorProps) {
  const isMobile = useMobile()

  const handleDelete = useCallback(() => {
    const count = selectedNodes.length
    const message = count === 1 
      ? 'Delete this node?' 
      : `Delete ${count} selected nodes?`
    if (confirm(message)) {
      onDelete()
    }
  }, [onDelete, selectedNodes.length])

  const canCreateMarriage = useMemo(() => {
    if (selectedNodes.length !== 2) return false
    const [node1, node2] = selectedNodes
    return node1.data.gender !== node2.data.gender
  }, [selectedNodes])

  if (selectedNodes.length === 0) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-3'} text-sm text-neutral-500`}>
        Select a node to edit.
      </div>
    )
  }

  const isMultiSelect = selectedNodes.length > 1
  const node = selectedNodes[0] // For single node editing

  const content = (
    <div className="space-y-3 text-sm">
      {isMultiSelect && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="font-semibold text-blue-900 mb-1">
            {selectedNodes.length} nodes selected
          </div>
          <div className="text-xs text-blue-700">
            {selectedNodes.map((n) => n.data.name).join(', ')}
          </div>
          {canCreateMarriage && onCreateMarriage && (
            <button
              className="mt-2 w-full bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700 text-sm font-medium"
              onClick={onCreateMarriage}
            >
              Create Marriage Link
            </button>
          )}
        </div>
      )}
      {!isMultiSelect && (
        <>
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-neutral-600">Name*</label>
            <input
              className="col-span-2 border rounded-md px-2 py-1.5 min-h-[44px]"
              value={node.data.name || ''}
              onChange={(e) => onUpdate({ name: e.target.value })}
              autoFocus={!isMobile}
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-neutral-600">Gender*</label>
            <select
              className="col-span-2 border rounded-md px-2 py-1.5 min-h-[44px]"
              value={node.data.gender}
              onChange={(e) => onUpdate({ gender: (e.target.value as Gender) || 'M' })}
            >
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-neutral-600">DoB</label>
            <input
              type="date"
              className="col-span-2 border rounded-md px-2 py-1.5 min-h-[44px]"
              value={node.data.dob || ''}
              onChange={(e) => onUpdate({ dob: e.target.value || undefined })}
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <label className="text-neutral-600">DoD</label>
            <input
              type="date"
              className="col-span-2 border rounded-md px-2 py-1.5 min-h-[44px]"
              value={node.data.dod || ''}
              onChange={(e) => onUpdate({ dod: e.target.value || undefined })}
            />
          </div>
        </>
      )}
      <div className="flex gap-2 pt-2">
        <button
          className="border rounded-md px-3 py-2 hover:bg-neutral-50 min-h-[44px] flex-1"
          onClick={handleDelete}
        >
          Delete {isMultiSelect ? 'Nodes' : 'Node'}
        </button>
        <button
          className="border rounded-md px-3 py-2 hover:bg-neutral-50 min-h-[44px] flex-1"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-neutral-500">
          MVP rules are off. This is a free-form graph. Name and gender are required for data
          hygiene.
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 bg-white border-t rounded-t-2xl shadow-lg z-50 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Edit Node</div>
          <button
            className="text-neutral-500 hover:text-neutral-700 min-h-[44px] min-w-[44px]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4">{content}</div>
      </div>
    )
  }

  return (
    <aside className="border-l bg-white p-3 overflow-y-auto h-full">{content}</aside>
  )
}

