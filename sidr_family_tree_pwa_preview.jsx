import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

type Gender = 'M' | 'F'

type PersonData = {
  name: string
  gender: Gender
  dob?: string
  dod?: string
}

type LinkKind = 'descendant' | 'marriage' | 'divorced' | 'widowed'

const uid = () => Math.random().toString(36).slice(2, 9)

const edgeStyleByType: Record<LinkKind, { style?: React.CSSProperties; markerEnd?: any; label?: string }> = {
  descendant: { style: { strokeDasharray: '0', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed }, label: 'descendant' },
  marriage: { style: { strokeDasharray: '4 2', strokeWidth: 2 }, label: 'marriage' },
  divorced: { style: { strokeDasharray: '2 4', strokeWidth: 2 }, label: 'divorced' },
  widowed: { style: { strokeDasharray: '1 3', strokeWidth: 2 }, label: 'widowed' },
}

function PersonNode({ data, selected }: { data: PersonData; selected: boolean }) {
  return (
    <div className={[ 'rounded-2xl shadow-sm border min-w-[160px] max-w-[220px] bg-white', selected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-neutral-200' ].join(' ')}>
      <div className="flex items-center justify-between px-3 py-2 border-b text-sm">
        <div className="font-medium truncate" title={data.name}>{data.name || 'Unnamed'}</div>
        <span className={ 'inline-flex items-center px-2 py-0.5 rounded-full text-xs border ' + (data.gender === 'M' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-rose-50 text-rose-700 border-rose-200') }>{data.gender}</span>
      </div>
      <div className="px-3 py-2 text-xs text-neutral-600 grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="text-neutral-400">DoB</div>
        <div className="truncate" title={data.dob}>{data.dob || '—'}</div>
        <div className="text-neutral-400">DoD</div>
        <div className="truncate" title={data.dod}>{data.dod || '—'}</div>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = { person: memo(PersonNode) }

function Editor() {
  const initialNodes = useMemo(() => [{ id: uid(), type: 'person', position: { x: 100, y: 100 }, data: { name: 'Root', gender: 'M' as Gender } }], [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [linkType, setLinkType] = useState<LinkKind>('descendant')
  const [dirty, setDirty] = useState(false)
  const rf = useReactFlow()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const onPaneClick = useCallback((evt: React.MouseEvent) => {
    const pos = rf.screenToFlowPosition({ x: evt.clientX, y: evt.clientY })
    const newNode = { id: uid(), type: 'person', position: { x: pos.x, y: pos.y }, data: { name: 'New Person', gender: 'M' as Gender } }
    setNodes((nds) => nds.concat(newNode))
    setSelectedNodeId(newNode.id)
    setDirty(true)
  }, [rf, setNodes])

  const onConnect = useCallback((connection: Connection) => {
    const { style, markerEnd, label } = edgeStyleByType[linkType]
    setEdges((eds) => addEdge({ ...connection, id: uid(), data: { type: linkType }, label, style, markerEnd, animated: linkType === 'descendant' }, eds))
    setDirty(true)
  }, [linkType, setEdges])

  const onSelectionChange = useCallback(({ nodes: ns }: { nodes: any[] }) => {
    setSelectedNodeId(ns?.[0]?.id)
  }, [])

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId])

  const patchSelected = useCallback((patch: Partial<PersonData>) => {
    if (!selectedNode) return
    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, ...patch } } : n)))
    setDirty(true)
  }, [selectedNode, setNodes])

  const deleteSelected = useCallback(() => {
    if (!selectedNode) return
    const id = selectedNode.id
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setSelectedNodeId(undefined)
    setDirty(true)
  }, [selectedNode, setEdges, setNodes])

  const onNodeContextMenu = useCallback((_evt: React.MouseEvent, node: any) => {
    setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id))
    setNodes((nds) => nds.filter((n) => n.id !== node.id))
    if (selectedNodeId === node.id) setSelectedNodeId(undefined)
    setDirty(true)
  }, [selectedNodeId, setEdges, setNodes])

  const handleExport = useCallback(() => {
    const payload = { version: 1, nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })), edges: edges.map(({ id, source, target, data, label }) => ({ id, source, target, data, label })), updatedAt: Date.now() }
    const safeName = `sidr-tree-${new Date().toISOString().replace(/[:]/g, '-')}.json`
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = safeName
    a.click()
    URL.revokeObjectURL(a.href)
    setDirty(false)
  }, [nodes, edges])

  const handleImport = useCallback(async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!Array.isArray(json.nodes) || !Array.isArray(json.edges)) throw new Error('Invalid file')
      setNodes(json.nodes.map((n: any) => ({ id: n.id ?? uid(), type: 'person', position: n.position ?? { x: 0, y: 0 }, data: { name: n.data?.name ?? 'Unnamed', gender: (n.data?.gender === 'F' ? 'F' : 'M') as Gender, dob: n.data?.dob, dod: n.data?.dod } })))
      setEdges(json.edges.map((e: any) => { const kind: LinkKind = ['marriage', 'divorced', 'widowed'].includes(e.data?.type) ? e.data.type : 'descendant'; const { style, markerEnd, label } = edgeStyleByType[kind]; return { id: e.id ?? uid(), source: e.source, target: e.target, data: { type: kind }, label, style, markerEnd, animated: kind === 'descendant' } }))
      setSelectedNodeId(undefined)
      setDirty(false)
      setTimeout(() => rf.fitView({ padding: 0.2 }), 16)
    } catch (err) {
      alert('Import failed: ' + (err as Error).message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [rf, setNodes, setEdges])

  return (
    <div className="h-screen w-full bg-neutral-50 text-neutral-900">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-3 sm:px-4 py-2 flex items-center gap-2">
        <div className="font-semibold tracking-tight">SIDR Preview</div>
        <div className="mx-2 h-6 w-px bg-neutral-200" />
        <div className="flex items-center gap-1 text-sm">
          <label className="mr-1">Link</label>
          <select className="border rounded-md px-2 py-1 bg-white" value={linkType} onChange={(e) => setLinkType(e.target.value as LinkKind)}>
            <option value="descendant">descendant</option>
            <option value="marriage">marriage</option>
            <option value="divorced">divorced</option>
            <option value="widowed">widowed</option>
          </select>
          <button className="ml-2 border rounded-md px-2 py-1 hover:bg-neutral-50" onClick={() => rf.fitView({ padding: 0.2 })}>Fit</button>
          <button className="border rounded-md px-2 py-1 hover:bg-neutral-50" onClick={handleExport}>Export JSON{dirty ? '*' : ''}</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.currentTarget.files?.[0] ?? null)} />
          <button className="border rounded-md px-2 py-1 hover:bg-neutral-50" onClick={() => fileRef.current?.click()}>Import JSON</button>
        </div>
        <div className="ml-auto text-xs text-neutral-500">Click canvas to add. Drag to move. Connect nodes to link. Right-click node to delete.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] h-[calc(100vh-44px)]">
        <div className="relative">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onPaneClick={onPaneClick} onNodeClick={(_, n) => setSelectedNodeId(n.id)} onNodeContextMenu={onNodeContextMenu} onSelectionChange={onSelectionChange} nodeTypes={nodeTypes} fitView connectionLineStyle={{ strokeWidth: 2 }} proOptions={{ hideAttribution: true }}>
            <Background gap={16} size={1} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
        <aside className="border-t md:border-t-0 md:border-l bg-white p-3 overflow-y-auto">
          <div className="font-semibold mb-2">Inspector</div>
          {!selectedNode ? (
            <div className="text-sm text-neutral-500">Select a node to edit.</div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-neutral-600">Name*</label>
                <input className="col-span-2 border rounded-md px-2 py-1" value={(selectedNode.data as PersonData).name || ''} onChange={(e) => patchSelected({ name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-neutral-600">Gender*</label>
                <select className="col-span-2 border rounded-md px-2 py-1" value={(selectedNode.data as PersonData).gender} onChange={(e) => patchSelected({ gender: (e.target.value as Gender) || 'M' })}>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-neutral-600">DoB</label>
                <input type="date" className="col-span-2 border rounded-md px-2 py-1" value={(selectedNode.data as PersonData).dob || ''} onChange={(e) => patchSelected({ dob: e.target.value || undefined })} />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-neutral-600">DoD</label>
                <input type="date" className="col-span-2 border rounded-md px-2 py-1" value={(selectedNode.data as PersonData).dod || ''} onChange={(e) => patchSelected({ dod: e.target.value || undefined })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="border rounded-md px-3 py-1.5 hover:bg-neutral-50" onClick={deleteSelected}>Delete Node</button>
                <button className="border rounded-md px-3 py-1.5 hover:bg-neutral-50" onClick={() => setSelectedNodeId(undefined)}>Deselect</button>
              </div>
            </div>
          )}
          <div className="mt-6 pt-4 border-t">
            <div className="text-xs text-neutral-500">MVP rules are off. This is a free-form graph. Name and gender are required for data hygiene.</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}
