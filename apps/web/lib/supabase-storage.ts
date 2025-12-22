/**
 * Supabase Storage Utility
 * Handles file uploads to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

const BUCKET_NAME = 'uploads' // Your Supabase bucket name

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
    file: File,
    folder: string = 'events'
): Promise<{ url: string; path: string } | null> {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured')
            return null
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        console.log('📤 Uploading to Supabase:', fileName)

        // Upload file
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('❌ Supabase upload error:', error)
            throw error
        }

        console.log('✅ Upload successful:', data.path)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path)

        return {
            url: publicUrl,
            path: data.path
        }
    } catch (error) {
        console.error('❌ Upload failed:', error)
        return null
    }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleToSupabase(
    files: File[],
    folder: string = 'events'
): Promise<Array<{ url: string; path: string }>> {
    const uploads = await Promise.all(
        files.map(file => uploadToSupabase(file, folder))
    )

    return uploads.filter((upload): upload is { url: string; path: string } => upload !== null)
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(path: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path])

        if (error) {
            console.error('❌ Delete error:', error)
            return false
        }

        console.log('✅ File deleted:', path)
        return true
    } catch (error) {
        console.error('❌ Delete failed:', error)
        return false
    }
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, expiresIn)

        if (error) {
            console.error('❌ Signed URL error:', error)
            return null
        }

        return data.signedUrl
    } catch (error) {
        console.error('❌ Signed URL failed:', error)
        return null
    }
}
