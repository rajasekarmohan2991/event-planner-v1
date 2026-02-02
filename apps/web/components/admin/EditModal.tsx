'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EditModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    field: string
    currentValue: string
    onSave: (value: string) => void
}

export function EditModal({ isOpen, onClose, title, field, currentValue, onSave }: EditModalProps) {
    const [value, setValue] = useState(currentValue)
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) return null

    const handleSave = async () => {
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        onSave(value)
        setIsSaving(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field}
                        </label>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full"
                            placeholder={`Enter ${field.toLowerCase()}`}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            {isSaving ? (
                                <>
                                    <Save className="w-4 h-4 mr-2 animate-pulse" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface ToggleModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    field: string
    currentValue: boolean
    onSave: (value: boolean) => void
}

export function ToggleModal({ isOpen, onClose, title, field, currentValue, onSave }: ToggleModalProps) {
    const [value, setValue] = useState(currentValue)
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) return null

    const handleSave = async () => {
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        onSave(value)
        setIsSaving(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{field}</span>
                        <button
                            onClick={() => setValue(!value)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            {isSaving ? (
                                <>
                                    <Save className="w-4 h-4 mr-2 animate-pulse" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
