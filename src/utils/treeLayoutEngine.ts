import type { FamilyTree } from '../types/domain'

export interface LayoutNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'person' | 'marriage'
  generation: number
}

export interface LayoutConfig {
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  isRTL: boolean
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 120,
  nodeHeight: 60,
  horizontalSpacing: 200,
  verticalSpacing: 150,
  isRTL: false
}

export function calculateHierarchicalLayout(
  data: FamilyTree, 
  config: Partial<LayoutConfig> = {}
): LayoutNode[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const nodes: LayoutNode[] = []
  
  // Build generation map
  const generations = buildGenerationMap(data)
  
  // Calculate positions for each generation
  Object.entries(generations).forEach(([generationStr, personIds]) => {
    const generation = parseInt(generationStr)
    const y = generation * finalConfig.verticalSpacing
    
    // Calculate horizontal positions for this generation
    const positions = calculateHorizontalPositions(
      personIds, 
      data, 
      finalConfig
    )
    
    // Add person nodes
    personIds.forEach((personId, index) => {
      const x = positions[index]
      
      nodes.push({
        id: personId,
        x: finalConfig.isRTL ? -x : x,
        y,
        width: finalConfig.nodeWidth,
        height: finalConfig.nodeHeight,
        type: 'person',
        generation
      })
    })
    
    // Add marriage nodes for this generation
    const marriages = data.marriages.filter(marriage => {
      const husband = marriage.husbandId ? data.persons.find(p => p.id === marriage.husbandId) : null
      const wife = marriage.wifeId ? data.persons.find(p => p.id === marriage.wifeId) : null
      return husband && wife && 
             marriage.husbandId && marriage.wifeId &&
             personIds.includes(marriage.husbandId) && 
             personIds.includes(marriage.wifeId)
    })
    
    marriages.forEach(marriage => {
      const husbandIndex = personIds.indexOf(marriage.husbandId!)
      const wifeIndex = personIds.indexOf(marriage.wifeId!)
      
      if (husbandIndex !== -1 && wifeIndex !== -1) {
        const husbandX = positions[husbandIndex]
        const wifeX = positions[wifeIndex]
        const marriageX = (husbandX + wifeX) / 2
        
        nodes.push({
          id: `marriage-${marriage.id}`,
          x: finalConfig.isRTL ? -marriageX : marriageX,
          y: y + finalConfig.nodeHeight / 2,
          width: 20,
          height: 20,
          type: 'marriage',
          generation
        })
      }
    })
  })
  
  return nodes
}

function buildGenerationMap(data: FamilyTree): Record<number, string[]> {
  const generations: Record<number, string[]> = {}
  const visited = new Set<string>()
  
  // Find root persons (those with no parents)
  const rootPersons = data.persons.filter(p => {
    const hasParents = data.children.some(child => child.childId === p.id)
    return !hasParents
  })
  
  // Start with root persons at generation 0
  if (rootPersons.length > 0) {
    generations[0] = rootPersons.map(p => p.id)
    rootPersons.forEach(p => visited.add(p.id))
  }
  
  // Build subsequent generations
  let currentGeneration = 0
  while (generations[currentGeneration]) {
    const currentGenPersons = generations[currentGeneration]
    const nextGenPersons: string[] = []
    
    // Find children of current generation
    currentGenPersons.forEach(personId => {
      // Find marriages involving this person
      const marriages = data.marriages.filter(m => 
        m.husbandId === personId || m.wifeId === personId
      )
      
      // Find children of these marriages
      marriages.forEach(marriage => {
        const children = data.children
          .filter(child => child.marriageId === marriage.id)
          .map(child => child.childId)
          .filter(childId => !visited.has(childId))
        
        nextGenPersons.push(...children)
        children.forEach(childId => visited.add(childId))
      })
    })
    
    if (nextGenPersons.length > 0) {
      generations[currentGeneration + 1] = nextGenPersons
      currentGeneration++
    } else {
      break
    }
  }
  
  return generations
}

function calculateHorizontalPositions(
  personIds: string[],
  _data: FamilyTree,
  config: LayoutConfig
): number[] {
  const positions: number[] = []
  const totalWidth = (personIds.length - 1) * config.horizontalSpacing
  const startX = -totalWidth / 2
  
  personIds.forEach((_personId, index) => {
    const x = startX + index * config.horizontalSpacing
    positions.push(x)
  })
  
  return positions
}

export function getNodePosition(nodeId: string, layoutNodes: LayoutNode[]): { x: number, y: number } | null {
  const node = layoutNodes.find(n => n.id === nodeId)
  return node ? { x: node.x, y: node.y } : null
}

export function getGenerationBounds(generation: number, layoutNodes: LayoutNode[]): { minX: number, maxX: number, minY: number, maxY: number } {
  const genNodes = layoutNodes.filter(n => n.generation === generation)
  
  if (genNodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
  
  const xs = genNodes.map(n => n.x)
  const ys = genNodes.map(n => n.y)
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

export function centerTree(layoutNodes: LayoutNode[]): LayoutNode[] {
  if (layoutNodes.length === 0) return layoutNodes
  
  // Find bounds of all nodes
  const xs = layoutNodes.map(n => n.x)
  const ys = layoutNodes.map(n => n.y)
  
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  
  // Center the tree at origin
  return layoutNodes.map(node => ({
    ...node,
    x: node.x - centerX,
    y: node.y - centerY
  }))
}
