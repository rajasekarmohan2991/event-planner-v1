/**
 * Example: Image Upload Component for Event Creation
 * Shows how to use the useImageUpload hook
 */

'use client'

import { useState } from 'react'
import { useImageUpload } from '@/hooks/use-image-upload'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export function EventImageUpload({ onImageUploaded }: { onImageUploaded: (url: string) => void }) {
    const [preview, setPreview] = useState<string | null>(null)
    const { uploading, error, uploadImage } = useImageUpload()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Show preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload to Supabase
        const url = await uploadImage(file, 'events')
        if (url) {
            onImageUploaded(url)
        }
    }

    const clearImage = () => {
        setPreview(null)
        onImageUploaded('')
    }

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Image
            </label>

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="text-white text-sm">Uploading...</div>
                        </div>
                    )}
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF up to 10MB
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                </label>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ {error}
                </p>
            )}

            {uploading && (
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    ⏳ Uploading to Supabase...
                </p>
            )}
        </div>
    )
}

/**
 * Usage in Event Creation Form:
 * 
 * const [bannerUrl, setBannerUrl] = useState('')
 * 
 * <EventImageUpload onImageUploaded={setBannerUrl} />
 * 
 * Then use bannerUrl when creating the event
 */
