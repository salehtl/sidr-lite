import type { TreeData, TreeNode, TreeEdge } from '../types'

export function exportTree(nodes: TreeNode[], edges: TreeEdge[]): TreeData {
  return {
    version: 1,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, data, label }) => ({ id, source, target, data, label })),
    updatedAt: Date.now()
  }
}

export async function downloadTree(nodes: TreeNode[], edges: TreeEdge[]): Promise<void> {
  const data = exportTree(nodes, edges)
  const safeName = `sidr-tree-${new Date().toISOString().replace(/[:]/g, '-')}.json`
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importTree(file: File): Promise<{ nodes: TreeNode[]; edges: TreeEdge[] }> {
  const text = await file.text()
  const json = JSON.parse(text)
  
  if (!json.nodes || !Array.isArray(json.nodes) || !json.edges || !Array.isArray(json.edges)) {
    throw new Error('Invalid file format')
  }

  const nodes: TreeNode[] = json.nodes.map((n: any) => ({
    id: n.id || generateId(),
    type: 'person' as const,
    position: n.position || { x: 0, y: 0 },
    data: {
      name: n.data?.name || 'Unnamed',
      gender: (n.data?.gender === 'F' ? 'F' : 'M') as 'M' | 'F',
      dob: n.data?.dob,
      dod: n.data?.dod
    }
  }))

  const edges: TreeEdge[] = json.edges.map((e: any) => {
    const kind: 'descendant' | 'marriage' | 'divorced' | 'widowed' = 
      ['marriage', 'divorced', 'widowed'].includes(e.data?.type) ? e.data.type : 'descendant'
    
    return {
      id: e.id || generateId(),
      source: e.source,
      target: e.target,
      data: { type: kind },
      label: kind
    }
  })

  return { nodes, edges }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

