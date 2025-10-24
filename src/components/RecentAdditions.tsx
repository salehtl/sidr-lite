import { useState, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
import { Clock, Undo, CheckCircle } from 'lucide-react'

interface RecentAddition {
  id: string
  type: 'person' | 'marriage' | 'child'
  name: string
  timestamp: number
  action: string
}

export default function RecentAdditions() {
  const { data } = useFamilyTreeStore()
  const [recentAdditions, setRecentAdditions] = useState<RecentAddition[]>([])
  const [showUndo, setShowUndo] = useState(false)
  
  // Track recent additions (last 5)
  useEffect(() => {
    const additions = JSON.parse(localStorage.getItem('recent-additions') || '[]')
    setRecentAdditions(additions.slice(0, 5))
  }, [data])
  
  const handleUndo = () => {
    // This is a simplified undo - in a real implementation,
    // you'd need to track the exact state changes
    setShowUndo(true)
    setTimeout(() => setShowUndo(false), 2000)
  }
  
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor(diff / 1000)
    
    if (minutes < 1) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'person': return <CheckCircle size={14} className="text-green-600" />
      case 'marriage': return <CheckCircle size={14} className="text-pink-600" />
      case 'child': return <CheckCircle size={14} className="text-blue-600" />
      default: return <CheckCircle size={14} className="text-gray-600" />
    }
  }
  
  if (recentAdditions.length === 0) {
    return null
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock size={16} className="text-gray-600" />
          Recent Additions
        </h3>
        {showUndo && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle size={14} />
            Undo available
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {recentAdditions.map((addition, index) => (
          <div 
            key={`${addition.id}-${index}`}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              {getActionIcon(addition.type)}
              <span className="text-sm text-gray-700">{addition.action}</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(addition.timestamp)}</span>
            </div>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              title="Undo this action"
            >
              <Undo size={12} />
              Undo
            </button>
          </div>
        ))}
      </div>
      
      {recentAdditions.length >= 5 && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Showing last 5 additions
        </div>
      )}
    </div>
  )
}
