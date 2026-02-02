/**
 * Image Upload Hook
 * Easy-to-use hook for uploading images to Supabase
 */

'use client'

import { useState } from 'react'

interface UploadResult {
    url: string
    path: string
}

interface UseImageUploadReturn {
    uploading: boolean
    error: string | null
    uploadImage: (file: File, folder?: string) => Promise<string | null>
    uploadMultiple: (files: File[], folder?: string) => Promise<string[]>
}

export function useImageUpload(): UseImageUploadReturn {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const uploadImage = async (file: File, folder: string = 'events'): Promise<string | null> => {
        try {
            setUploading(true)
            setError(null)

            console.log('📤 Uploading image:', file.name)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder)

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            console.log('✅ Upload successful:', data.url)
            return data.url
        } catch (err: any) {
            console.error('❌ Upload error:', err)
            setError(err.message)
            return null
        } finally {
            setUploading(false)
        }
    }

    const uploadMultiple = async (files: File[], folder: string = 'events'): Promise<string[]> => {
        try {
            setUploading(true)
            setError(null)

            console.log(`📤 Uploading ${files.length} images`)

            const formData = new FormData()
            files.forEach((file, index) => {
                formData.append(`file${index}`, file)
            })
            formData.append('folder', folder)

            const response = await fetch('/api/upload/image', {
                method: 'PUT',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            console.log(`✅ Uploaded ${data.files.length} images successfully`)
            return data.files.map((f: UploadResult) => f.url)
        } catch (err: any) {
            console.error('❌ Multiple upload error:', err)
            setError(err.message)
            return []
        } finally {
            setUploading(false)
        }
    }

    return {
        uploading,
        error,
        uploadImage,
        uploadMultiple
    }
}
