import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export const isCloudinaryConfigured = () => {
  return !!(cloudName && apiKey && apiSecret)
}

/**
 * Upload a file to Cloudinary
 * @param buffer File buffer
 * @param folder Folder name in Cloudinary
 * @param resourceType 'image' | 'video' | 'raw' | 'auto'
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'event-planner',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<{ url: string; public_id: string; format: string; secure_url: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured')
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else if (result) {
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
          })
        } else {
          reject(new Error('Unknown Cloudinary upload error'))
        }
      }
    )

    uploadStream.end(buffer)
  })
}
