import React, { useState, useRef, useEffect } from 'react'
import { useFamilyTreeStore } from '../store/familyTreeStore'
// Removed unused ValidationError import
import { preValidatePersonCreation } from '../utils/preValidationHelpers'
import { Plus, Trash2, Copy, Check, X, Download, Upload } from 'lucide-react'
import type { Gender, RelationshipType } from '../types/domain'
import FamilyTemplates, { applyTemplate } from './FamilyTemplates'

interface BatchRow {
  id: string
  name: string
  gender: Gender
  relationshipType: RelationshipType | null
  targetId: string | null
  errors: string[]
  status: 'pending' | 'saving' | 'saved' | 'error'
}

export default function BatchEntryMode() {
  const { data, createPerson, createMarriage, addChild, addSibling, addParent } = useFamilyTreeStore()
  const [rows, setRows] = useState<BatchRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  // Removed unused showTemplates state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  
  // Initialize with empty row
  useEffect(() => {
    if (rows.length === 0) {
      addRow()
    }
  }, [rows.length])

  const addRow = () => {
    const newRow: BatchRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      name: '',
      gender: 'M',
      relationshipType: null,
      targetId: null,
      errors: [],
      status: 'pending'
    }
    setRows([...rows, newRow])
  }

  const duplicateRow = (index: number) => {
    const rowToDuplicate = rows[index]
    const newRow: BatchRow = {
      ...rowToDuplicate,
      id: `row-${Date.now()}-${Math.random()}`,
      status: 'pending'
    }
    const newRows = [...rows]
    newRows.splice(index + 1, 0, newRow)
    setRows(newRows)
  }

  const deleteRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index)
      setRows(newRows)
    }
  }

  const updateRow = (index: number, field: keyof BatchRow, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value, errors: [], status: 'pending' }
    setRows(newRows)
  }

  const validateRow = (index: number) => {
    const row = rows[index]
    if (!row.name.trim() || !row.relationshipType) {
      return
    }

    const preValidation = preValidatePersonCreation(
      row.name,
      row.gender,
      row.relationshipType,
      row.targetId,
      data
    )

    const newRows = [...rows]
    newRows[index] = {
      ...row,
      errors: preValidation.errors,
      status: preValidation.isValid ? 'pending' : 'error'
    }
    setRows(newRows)
  }

  const processRow = async (index: number) => {
    const row = rows[index]
    if (row.status === 'saved' || row.status === 'saving') return

    updateRow(index, 'status', 'saving')

    try {
      let personId: string

      switch (row.relationshipType) {
        case 'root':
          personId = createPerson(row.name, row.gender)
          break
        case 'spouse':
          if (!row.targetId) throw new Error('Target person required')
          personId = createPerson(row.name, row.gender)
          createMarriage(row.targetId, personId)
          break
        case 'child':
          if (!row.targetId) throw new Error('Target marriage required')
          personId = addChild(row.targetId, row.name, row.gender)
          break
        case 'parent':
          if (!row.targetId) throw new Error('Target person required')
          personId = addParent(row.targetId, row.name, row.gender)
          break
        case 'sibling':
          if (!row.targetId) throw new Error('Target person required')
          personId = addSibling(row.targetId, row.name, row.gender)
          break
        default:
          throw new Error('Invalid relationship type')
      }

      updateRow(index, 'status', 'saved')
    } catch (error) {
      updateRow(index, 'status', 'error')
      updateRow(index, 'errors', [error instanceof Error ? error.message : 'Unknown error'])
    }
  }

  const processAllRows = async () => {
    setIsProcessing(true)
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.name.trim() && row.relationshipType && row.status === 'pending') {
        await processRow(i)
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    setIsProcessing(false)
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Gender', 'Relationship', 'Target ID'],
      ...rows.map(row => [
        row.name,
        row.gender,
        row.relationshipType || '',
        row.targetId || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'family-tree-batch.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').slice(1) // Skip header
      const newRows: BatchRow[] = lines
        .filter(line => line.trim())
        .map((line, index) => {
          const [name, gender, relationshipType, targetId] = line.split(',')
          return {
            id: `imported-${index}`,
            name: name?.trim() || '',
            gender: (gender?.trim() as Gender) || 'M',
            relationshipType: (relationshipType?.trim() as RelationshipType) || null,
            targetId: targetId?.trim() || null,
            errors: [],
            status: 'pending' as const
          }
        })
      
      setRows([...rows, ...newRows])
    }
    reader.readAsText(file)
  }

  const handleTemplateApply = async (templateData: any) => {
    try {
      await applyTemplate(templateData, { createPerson, createMarriage, addChild, addSibling, addParent })
      setShowTemplateModal(false)
    } catch (error) {
      console.error('Error applying template:', error)
    }
  }

  const getStatusIcon = (status: BatchRow['status']) => {
    switch (status) {
      case 'saved': return <Check size={16} className="text-green-600" />
      case 'saving': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'error': return <X size={16} className="text-red-600" />
      default: return null
    }
  }

  const getAvailableTargets = (relationshipType: RelationshipType | null) => {
    if (!relationshipType) return []
    
    if (relationshipType === 'child') {
      return data.marriages.map(m => {
        const husband = data.persons.find(p => p.id === m.husbandId)
        const wife = data.persons.find(p => p.id === m.wifeId)
        return {
          id: m.id,
          label: `${husband?.name || 'Unknown'} & ${wife?.name || 'Unknown'}`,
          type: 'marriage'
        }
      })
    } else {
      return data.persons.map(p => ({
        id: p.id,
        label: p.name,
        type: 'person'
      }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Batch Entry Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Templates
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <Download size={14} />
            Export CSV
          </button>
          <label className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-1">
            <Upload size={14} />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={importFromCSV}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <FamilyTemplates
          onClose={() => setShowTemplateModal(false)}
          onApply={handleTemplateApply}
        />
      )}

      {/* Batch Entry Table */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Gender</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Relationship</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Target</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-gray-200">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(index, 'name', e.target.value)}
                    onBlur={() => validateRow(index)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter name"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.gender}
                    onChange={(e) => updateRow(index, 'gender', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.relationshipType || ''}
                    onChange={(e) => updateRow(index, 'relationshipType', e.target.value || null)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="root">Root Person</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  {row.relationshipType && row.relationshipType !== 'root' && (
                    <select
                      value={row.targetId || ''}
                      onChange={(e) => updateRow(index, 'targetId', e.target.value || null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select target...</option>
                      {getAvailableTargets(row.relationshipType).map(target => (
                        <option key={target.id} value={target.id}>
                          {target.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    <span className="text-xs text-gray-500">
                      {row.status === 'pending' && 'Ready'}
                      {row.status === 'saving' && 'Saving...'}
                      {row.status === 'saved' && 'Saved'}
                      {row.status === 'error' && 'Error'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => duplicateRow(index)}
                      className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Duplicate row"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => deleteRow(index)}
                      className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => processRow(index)}
                      disabled={row.status === 'saving' || row.status === 'saved'}
                      className="p-1 text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
                      title="Process this row"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Row
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={processAllRows}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={16} />
                Process All Rows
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {rows.some(row => row.errors.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {rows.map((row, index) => 
              row.errors.map((error, errorIndex) => (
                <li key={`${row.id}-error-${errorIndex}`}>
                  Row {index + 1}: {error}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
