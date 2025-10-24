import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

interface UseKeyboardNavOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardNav({ shortcuts, enabled = true }: UseKeyboardNavOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.metaKey === event.metaKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      )
    })
    
    if (matchingShortcut) {
      event.preventDefault()
      event.stopPropagation()
      matchingShortcut.action()
    }
  }, [shortcuts, enabled])
  
  useEffect(() => {
    if (!enabled) return
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
  
  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      modifiers: {
        ctrl: s.ctrlKey,
        meta: s.metaKey,
        shift: s.shiftKey,
        alt: s.altKey
      },
      description: s.description
    }))
  }
}

// Helper function to create common shortcuts
export function createShortcuts(actions: {
  addSpouse?: () => void
  addChild?: () => void
  addParent?: () => void
  addSibling?: () => void
  submit?: () => void
  clear?: () => void
  focusSearch?: () => void
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []
  
  if (actions.addSpouse) {
    shortcuts.push({
      key: 's',
      metaKey: true,
      action: actions.addSpouse,
      description: 'Add as spouse'
    })
  }
  
  if (actions.addChild) {
    shortcuts.push({
      key: 'c',
      metaKey: true,
      action: actions.addChild,
      description: 'Add as child'
    })
  }
  
  if (actions.addParent) {
    shortcuts.push({
      key: 'p',
      metaKey: true,
      action: actions.addParent,
      description: 'Add as parent'
    })
  }
  
  if (actions.addSibling) {
    shortcuts.push({
      key: 'b',
      metaKey: true,
      action: actions.addSibling,
      description: 'Add as sibling'
    })
  }
  
  if (actions.submit) {
    shortcuts.push({
      key: 'Enter',
      metaKey: true,
      action: actions.submit,
      description: 'Submit form'
    })
  }
  
  if (actions.clear) {
    shortcuts.push({
      key: 'Escape',
      action: actions.clear,
      description: 'Clear form'
    })
  }
  
  if (actions.focusSearch) {
    shortcuts.push({
      key: '/',
      action: actions.focusSearch,
      description: 'Focus search'
    })
  }
  
  return shortcuts
}
