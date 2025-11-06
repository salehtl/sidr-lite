export type Gender = 'M' | 'F'

export type LinkKind = 'descendant' | 'marriage' | 'divorced' | 'widowed'

export interface PersonData {
  name: string
  gender: Gender
  dob?: string
  dod?: string
}

export interface TreeNode {
  id: string
  type: 'person'
  position: { x: number; y: number }
  data: PersonData
}

export interface TreeEdge {
  id: string
  source: string
  target: string
  data: { type: LinkKind }
  label?: string
  style?: React.CSSProperties
  markerEnd?: any
  animated?: boolean
}

export interface TreeData {
  version: number
  nodes: TreeNode[]
  edges: TreeEdge[]
  updatedAt: number
}

