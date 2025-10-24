import { useEffect, useRef, useCallback } from 'react'

export interface TouchGestureOptions {
  onLongPress?: (event: TouchEvent) => void
  onPinch?: (scale: number, center: { x: number, y: number }) => void
  onPan?: (delta: { x: number, y: number }) => void
  longPressDelay?: number
  pinchThreshold?: number
  panThreshold?: number
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    onLongPress,
    onPinch,
    onPan,
    longPressDelay = 500,
    pinchThreshold = 0.1,
    panThreshold = 10
  } = options

  const touchState = useRef({
    touches: [] as Touch[],
    longPressTimer: null as NodeJS.Timeout | null,
    lastPinchDistance: 0,
    lastPanPoint: { x: 0, y: 0 },
    isLongPressing: false,
    isPanning: false,
    isPinching: false
  })

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getCenter = useCallback((touches: Touch[]) => {
    if (touches.length === 0) return { x: 0, y: 0 }
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY }
    
    const x = touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length
    const y = touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length
    return { x, y }
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const state = touchState.current
    state.touches = Array.from(event.touches)
    
    // Clear any existing timers
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
    }

    if (state.touches.length === 1 && onLongPress) {
      // Start long press timer
      state.longPressTimer = setTimeout(() => {
        state.isLongPressing = true
        onLongPress(event)
      }, longPressDelay)
    } else if (state.touches.length === 2) {
      // Start pinch gesture
      state.isPinching = true
      state.lastPinchDistance = getDistance(state.touches[0], state.touches[1])
    } else if (state.touches.length === 1) {
      // Start pan gesture
      state.isPanning = true
      state.lastPanPoint = { x: state.touches[0].clientX, y: state.touches[0].clientY }
    }
  }, [onLongPress, longPressDelay, getDistance])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const state = touchState.current
    const currentTouches = Array.from(event.touches)
    
    // Cancel long press if moved
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
      state.longPressTimer = null
    }

    if (state.isPinching && currentTouches.length === 2 && onPinch) {
      const currentDistance = getDistance(currentTouches[0], currentTouches[1])
      const scale = currentDistance / state.lastPinchDistance
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        const center = getCenter(currentTouches)
        onPinch(scale, center)
        state.lastPinchDistance = currentDistance
      }
    } else if (state.isPanning && currentTouches.length === 1 && onPan) {
      const currentPoint = { x: currentTouches[0].clientX, y: currentTouches[0].clientY }
      const delta = {
        x: currentPoint.x - state.lastPanPoint.x,
        y: currentPoint.y - state.lastPanPoint.y
      }
      
      const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y)
      if (distance > panThreshold) {
        onPan(delta)
        state.lastPanPoint = currentPoint
      }
    }
  }, [onPinch, onPan, pinchThreshold, panThreshold, getDistance, getCenter])

  const handleTouchEnd = useCallback((_event: TouchEvent) => {
    const state = touchState.current
    
    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
      state.longPressTimer = null
    }

    // Reset gesture states
    state.isLongPressing = false
    state.isPanning = false
    state.isPinching = false
    state.touches = []
  }, [])

  useEffect(() => {
    const element = document
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isLongPressing: touchState.current.isLongPressing,
    isPanning: touchState.current.isPanning,
    isPinching: touchState.current.isPinching
  }
}
