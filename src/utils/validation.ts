import type { TreeData, TreeNode, TreeEdge } from '../types'

export function validateTreeData(data: any): data is TreeData {
  if (!data || typeof data !== 'object') return false
  if (typeof data.version !== 'number') return false
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return false
  return true
}

export function validateNode(node: any): node is TreeNode {
  if (!node || typeof node !== 'object') return false
  if (typeof node.id !== 'string') return false
  if (node.type !== 'person') return false
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false
  if (!node.data || typeof node.data.name !== 'string' || !['M', 'F'].includes(node.data.gender)) return false
  return true
}

export function validateEdge(edge: any): edge is TreeEdge {
  if (!edge || typeof edge !== 'object') return false
  if (typeof edge.id !== 'string') return false
  if (typeof edge.source !== 'string' || typeof edge.target !== 'string') return false
  return true
}

