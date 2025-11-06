import { useRef, useCallback } from 'react'
import { useReactFlow } from 'reactflow'
import { LinkTypeSelector } from './LinkTypeSelector'
import { downloadTree, importTree } from '../utils/export'
import type { LinkKind } from '../types'
import type { Node, Edge } from 'reactflow'

interface ToolbarProps {
  linkType: LinkKind
  onLinkTypeChange: (type: LinkKind) => void
  nodes: Node[]
  edges: Edge[]
  onTreeLoad: (nodes: Node[], edges: Edge[]) => void
  isDirty?: boolean
}

export function Toolbar({
  linkType,
  onLinkTypeChange,
  nodes,
  edges,
  onTreeLoad,
  isDirty = false
}: ToolbarProps) {
  const { fitView } = useReactFlow()
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = useCallback(() => {
    downloadTree(
      nodes.map(({ id, type, position, data }) => ({ id, type: (type || 'person') as 'person', position, data })),
      edges.map(({ id, source, target, data, label }) => ({
        id,
        source,
        target,
        data,
        label: typeof label === 'string' ? label : undefined
      }))
    ).catch(console.error)
  }, [nodes, edges])

  const handleImport = useCallback(
    async (file: File | null) => {
      if (!file) return
      try {
        const { nodes: importedNodes, edges: importedEdges } = await importTree(file)
        onTreeLoad(importedNodes, importedEdges)
        setTimeout(() => fitView({ padding: 0.2 }), 16)
      } catch (err) {
        alert('Import failed: ' + (err as Error).message)
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    },
    [onTreeLoad, fitView]
  )

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2">
      <div className="font-semibold tracking-tight">SIDR Family Tree</div>
      <div className="mx-2 h-6 w-px bg-neutral-200 hidden sm:block" />
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <label className="mr-1 text-xs sm:text-sm">Link:</label>
        <LinkTypeSelector value={linkType} onChange={onLinkTypeChange} />
        <button
          className="border rounded-md px-2 py-1 hover:bg-neutral-50 min-h-[36px] text-xs sm:text-sm"
          onClick={() => fitView({ padding: 0.2 })}
        >
          Fit View
        </button>
        <button
          className="border rounded-md px-2 py-1 hover:bg-neutral-50 min-h-[36px] text-xs sm:text-sm"
          onClick={handleExport}
        >
          Export{isDirty ? '*' : ''}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => handleImport(e.currentTarget.files?.[0] ?? null)}
        />
        <button
          className="border rounded-md px-2 py-1 hover:bg-neutral-50 min-h-[36px] text-xs sm:text-sm"
          onClick={() => fileRef.current?.click()}
        >
          Import
        </button>
      </div>
      <div className="ml-auto text-xs text-neutral-500 hidden lg:block">
        Tap canvas to add. Drag to move. Connect nodes to link. Right-click node to delete.
      </div>
    </div>
  )
}

