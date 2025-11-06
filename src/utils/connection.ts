import type { Node, Connection } from 'reactflow'

// Estimated node dimensions (based on PersonNode component)
// These are fallbacks when actual dimensions aren't available
const DEFAULT_NODE_WIDTH = 190 // Average of min-w-[160px] and max-w-[220px]
const DEFAULT_NODE_HEIGHT = 100 // Estimated based on content

/**
 * Determines the best handle positions for connecting two nodes
 * based on their relative positions in the canvas.
 */
export function getSmartHandles(
  sourceNode: Node,
  targetNode: Node,
  connection?: Connection
): { sourceHandle: string; targetHandle: string } {
  // If handles are already specified in the connection, use them
  if (connection?.sourceHandle && connection?.targetHandle) {
    return {
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle
    }
  }

  // Use actual node dimensions if available, otherwise use defaults
  // ReactFlow sets width/height on nodes after they're measured
  const sourceWidth = (typeof sourceNode.width === 'number' ? sourceNode.width : DEFAULT_NODE_WIDTH)
  const sourceHeight = (typeof sourceNode.height === 'number' ? sourceNode.height : DEFAULT_NODE_HEIGHT)
  const targetWidth = (typeof targetNode.width === 'number' ? targetNode.width : DEFAULT_NODE_WIDTH)
  const targetHeight = (typeof targetNode.height === 'number' ? targetNode.height : DEFAULT_NODE_HEIGHT)

  // Calculate center positions of nodes
  const sourceCenterX = sourceNode.position.x + sourceWidth / 2
  const sourceCenterY = sourceNode.position.y + sourceHeight / 2
  const targetCenterX = targetNode.position.x + targetWidth / 2
  const targetCenterY = targetNode.position.y + targetHeight / 2

  // Calculate differences
  const deltaX = targetCenterX - sourceCenterX
  const deltaY = targetCenterY - sourceCenterY

  // Determine which axis has the larger difference
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)

  let sourceHandle: string
  let targetHandle: string

  if (absDeltaX > absDeltaY) {
    // Horizontal connection (left/right)
    if (deltaX > 0) {
      // Target is to the right of source
      sourceHandle = 'right-source'
      targetHandle = 'left-target'
    } else {
      // Target is to the left of source
      sourceHandle = 'left-source'
      targetHandle = 'right-target'
    }
  } else {
    // Vertical connection (top/bottom)
    if (deltaY > 0) {
      // Target is below source
      sourceHandle = 'bottom-source'
      targetHandle = 'top-target'
    } else {
      // Target is above source
      sourceHandle = 'top-source'
      targetHandle = 'bottom-target'
    }
  }

  return { sourceHandle, targetHandle }
}

