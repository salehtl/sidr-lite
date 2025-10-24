import { X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 text-white',
          icon: 'text-red-600'
        }
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: 'text-yellow-600'
        }
      case 'info':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: 'text-blue-600'
        }
      default:
        return {
          button: 'bg-red-600 hover:bg-red-700 text-white',
          icon: 'text-red-600'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
