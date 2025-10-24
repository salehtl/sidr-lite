import { useMemo, useCallback } from 'react'
import type { Node } from 'reactflow'

export interface VirtualizationOptions {
  viewportWidth: number
  viewportHeight: number
  nodeWidth: number
  nodeHeight: number
  buffer: number
}

export interface VirtualizedNode extends Node {
  isVisible: boolean
  isInBuffer: boolean
}

export function useVirtualization(
  nodes: Node[],
  options: VirtualizationOptions
) {
  const {
    viewportWidth,
    viewportHeight,
    nodeWidth,
    nodeHeight,
    buffer = 200
  } = options

  const virtualizedNodes = useMemo(() => {
    if (nodes.length === 0) return []

    // Calculate viewport bounds
    const viewportLeft = 0
    const viewportRight = viewportWidth
    const viewportTop = 0
    const viewportBottom = viewportHeight

    // Add buffer to viewport
    const bufferedLeft = viewportLeft - buffer
    const bufferedRight = viewportRight + buffer
    const bufferedTop = viewportTop - buffer
    const bufferedBottom = viewportBottom + buffer

    return nodes.map(node => {
      const nodeLeft = node.position.x
      const nodeRight = node.position.x + nodeWidth
      const nodeTop = node.position.y
      const nodeBottom = node.position.y + nodeHeight

      // Check if node is in viewport
      const isInViewport = !(
        nodeRight < viewportLeft ||
        nodeLeft > viewportRight ||
        nodeBottom < viewportTop ||
        nodeTop > viewportBottom
      )

      // Check if node is in buffer zone
      const isInBuffer = !(
        nodeRight < bufferedLeft ||
        nodeLeft > bufferedRight ||
        nodeBottom < bufferedTop ||
        nodeTop > bufferedBottom
      )

      return {
        ...node,
        isVisible: isInViewport,
        isInBuffer: isInBuffer
      } as VirtualizedNode
    })
  }, [nodes, viewportWidth, viewportHeight, nodeWidth, nodeHeight, buffer])

  const visibleNodes = useMemo(() => {
    return virtualizedNodes.filter(node => node.isVisible)
  }, [virtualizedNodes])

  const bufferedNodes = useMemo(() => {
    return virtualizedNodes.filter(node => node.isInBuffer)
  }, [virtualizedNodes])

  const hiddenNodes = useMemo(() => {
    return virtualizedNodes.filter(node => !node.isInBuffer)
  }, [virtualizedNodes])

  const getVisibleCount = useCallback(() => {
    return visibleNodes.length
  }, [visibleNodes])

  const getTotalCount = useCallback(() => {
    return nodes.length
  }, [nodes.length])

  const getPerformanceMetrics = useCallback(() => {
    return {
      total: getTotalCount(),
      visible: getVisibleCount(),
      buffered: bufferedNodes.length,
      hidden: hiddenNodes.length,
      renderRatio: getVisibleCount() / getTotalCount()
    }
  }, [getTotalCount, getVisibleCount, bufferedNodes.length, hiddenNodes.length])

  return {
    virtualizedNodes,
    visibleNodes,
    bufferedNodes,
    hiddenNodes,
    getVisibleCount,
    getTotalCount,
    getPerformanceMetrics
  }
}
