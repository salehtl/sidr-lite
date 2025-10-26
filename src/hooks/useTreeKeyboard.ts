import { useEffect, useCallback } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'

export interface TreeKeyboardOptions {
  onSearch?: () => void
  onEdit?: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
}

export function useTreeKeyboard(options: TreeKeyboardOptions = {}) {
  const { selectedPersonId, selectedMarriageId, selectPerson, selectMarriage, deletePerson } = useFamilyTreeStore()
  const { onSearch, onEdit, onDelete } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    const { key, ctrlKey, metaKey } = event
    const isModifier = ctrlKey || metaKey

    switch (key) {
      case 'Delete':
      case 'Backspace':
        if (selectedPersonId) {
          event.preventDefault()
          if (onDelete) {
            onDelete(selectedPersonId)
          } else {
            // Default delete behavior
            if (confirm('Delete selected person?')) {
              try {
                deletePerson({ personId: selectedPersonId })
              } catch (error) {
                alert(`Cannot delete person: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }
          }
        }
        break

      case 'Escape':
        event.preventDefault()
        selectPerson(null)
        selectMarriage(null)
        break

      case 'f':
      case 'F':
        if (isModifier) {
          event.preventDefault()
          if (onSearch) {
            onSearch()
          }
        }
        break

      case 'Enter':
        if (selectedPersonId && onEdit) {
          event.preventDefault()
          onEdit(selectedPersonId)
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // TODO: Implement arrow key navigation between connected nodes
        // This would require building a graph of connections and finding next/previous nodes
        break
    }
  }, [selectedPersonId, selectedMarriageId, selectPerson, selectMarriage, deletePerson, onSearch, onEdit, onDelete])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    selectedPersonId,
    selectedMarriageId
  }
}
