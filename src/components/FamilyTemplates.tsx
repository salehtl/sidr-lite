import React, { useState } from 'react'
// Removed unused useFamilyTreeStore import
import { X, Users, Heart, Baby, UserPlus } from 'lucide-react'
import type { Gender } from '../types/domain'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  fields: TemplateField[]
}

interface TemplateField {
  id: string
  label: string
  type: 'text' | 'select'
  options?: { value: string; label: string }[]
  required: boolean
}

const templates: Template[] = [
  {
    id: 'nuclear-family',
    name: 'Nuclear Family',
    description: 'Two parents and their children',
    icon: Users,
    fields: [
      { id: 'father-name', label: 'Father Name', type: 'text', required: true },
      { id: 'mother-name', label: 'Mother Name', type: 'text', required: true },
      { id: 'child-count', label: 'Number of Children', type: 'select', options: [
        { value: '1', label: '1 child' },
        { value: '2', label: '2 children' },
        { value: '3', label: '3 children' },
        { value: '4', label: '4 children' },
        { value: '5', label: '5 children' }
      ], required: true }
    ]
  },
  {
    id: 'siblings',
    name: 'Siblings Group',
    description: 'Multiple siblings with same parents',
    icon: Users,
    fields: [
      { id: 'parent1-name', label: 'Parent 1 Name', type: 'text', required: true },
      { id: 'parent1-gender', label: 'Parent 1 Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true },
      { id: 'parent2-name', label: 'Parent 2 Name', type: 'text', required: true },
      { id: 'parent2-gender', label: 'Parent 2 Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true },
      { id: 'sibling-count', label: 'Number of Siblings', type: 'select', options: [
        { value: '2', label: '2 siblings' },
        { value: '3', label: '3 siblings' },
        { value: '4', label: '4 siblings' },
        { value: '5', label: '5 siblings' }
      ], required: true }
    ]
  },
  {
    id: 'couple',
    name: 'Couple',
    description: 'Two people married to each other',
    icon: Heart,
    fields: [
      { id: 'person1-name', label: 'Person 1 Name', type: 'text', required: true },
      { id: 'person1-gender', label: 'Person 1 Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true },
      { id: 'person2-name', label: 'Person 2 Name', type: 'text', required: true },
      { id: 'person2-gender', label: 'Person 2 Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true }
    ]
  },
  {
    id: 'parent-child-chain',
    name: 'Parent-Child Chain',
    description: 'Grandparent → Parent → Child',
    icon: Baby,
    fields: [
      { id: 'grandparent-name', label: 'Grandparent Name', type: 'text', required: true },
      { id: 'grandparent-gender', label: 'Grandparent Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true },
      { id: 'parent-name', label: 'Parent Name', type: 'text', required: true },
      { id: 'parent-gender', label: 'Parent Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true },
      { id: 'child-name', label: 'Child Name', type: 'text', required: true },
      { id: 'child-gender', label: 'Child Gender', type: 'select', options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' }
      ], required: true }
    ]
  }
]

interface FamilyTemplatesProps {
  onClose: () => void
  onApply: (templateData: any) => void
}

export default function FamilyTemplates({ onClose, onApply }: FamilyTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleCreate = async () => {
    if (!selectedTemplate) return

    setIsCreating(true)
    try {
      const templateData = {
        template: selectedTemplate,
        data: formData
      }
      await onApply(templateData)
      onClose()
    } catch (error) {
      console.error('Error creating template:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const isFormValid = () => {
    if (!selectedTemplate) return false
    return selectedTemplate.fields.every(field => 
      field.required ? formData[field.id]?.trim() : true
    )
  }

  const renderField = (field: TemplateField) => {
    if (field.type === 'select') {
      return (
        <select
          value={formData[field.id] || ''}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={field.required}
        >
          <option value="">Select {field.label}...</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        type="text"
        value={formData[field.id] || ''}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={`Enter ${field.label.toLowerCase()}`}
        required={field.required}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Family Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!selectedTemplate ? (
            /* Template Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <template.icon size={24} className="text-blue-600" />
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          ) : (
            /* Template Form */
            <div>
              <div className="flex items-center gap-3 mb-6">
                <selectedTemplate.icon size={24} className="text-blue-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTemplate.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedTemplate(null)
                    setFormData({})
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Templates
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!isFormValid() || isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Family
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Template application logic
export function applyTemplate(templateData: any, store: any) {
  const { template, data } = templateData

  switch (template.id) {
    case 'nuclear-family': {
      const fatherName = data['father-name']
      const motherName = data['mother-name']
      const childCount = parseInt(data['child-count'])

      // Create parents
      const fatherId = store.createPerson(fatherName, 'M')
      const motherId = store.createPerson(motherName, 'F')
      const marriageId = store.createMarriage(fatherId, motherId)

      // Create children
      const childIds = []
      for (let i = 1; i <= childCount; i++) {
        const childName = `Child ${i}`
        const childGender = i % 2 === 1 ? 'M' : 'F' // Alternate genders
        const childId = store.addChild(marriageId, childName, childGender)
        childIds.push(childId)
      }

      return { fatherId, motherId, marriageId, childIds }
    }

    case 'siblings': {
      const parent1Name = data['parent1-name']
      const parent1Gender = data['parent1-gender'] as Gender
      const parent2Name = data['parent2-name']
      const parent2Gender = data['parent2-gender'] as Gender
      const siblingCount = parseInt(data['sibling-count'])

      // Create parents
      const parent1Id = store.createPerson(parent1Name, parent1Gender)
      const parent2Id = store.createPerson(parent2Name, parent2Gender)
      const marriageId = store.createMarriage(parent1Id, parent2Id)

      // Create siblings
      const siblingIds = []
      for (let i = 1; i <= siblingCount; i++) {
        const siblingName = `Sibling ${i}`
        const siblingGender = i % 2 === 1 ? 'M' : 'F' // Alternate genders
        const siblingId = store.addChild(marriageId, siblingName, siblingGender)
        siblingIds.push(siblingId)
      }

      return { parent1Id, parent2Id, marriageId, siblingIds }
    }

    case 'couple': {
      const person1Name = data['person1-name']
      const person1Gender = data['person1-gender'] as Gender
      const person2Name = data['person2-name']
      const person2Gender = data['person2-gender'] as Gender

      const person1Id = store.createPerson(person1Name, person1Gender)
      const person2Id = store.createPerson(person2Name, person2Gender)
      const marriageId = store.createMarriage(person1Id, person2Id)

      return { person1Id, person2Id, marriageId }
    }

    case 'parent-child-chain': {
      const grandparentName = data['grandparent-name']
      const grandparentGender = data['grandparent-gender'] as Gender
      const parentName = data['parent-name']
      const parentGender = data['parent-gender'] as Gender
      const childName = data['child-name']
      const childGender = data['child-gender'] as Gender

      // Create grandparent
      const grandparentId = store.createPerson(grandparentName, grandparentGender)
      
      // Create parent
      const parentId = store.createPerson(parentName, parentGender)
      
      // Create marriage between grandparent and parent (assuming grandparent is one parent)
      const marriageId = store.createMarriage(grandparentId, parentId)
      
      // Create child
      const childId = store.addChild(marriageId, childName, childGender)

      return { grandparentId, parentId, childId, marriageId }
    }

    default:
      throw new Error(`Unknown template: ${template.id}`)
  }
}
