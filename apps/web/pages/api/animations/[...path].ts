import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Prevent directory traversal
    const filePath = path.join(process.cwd(), 'public', 'animations', ...(req.query.path as string[] || []))
    
    // Verify the file exists and is within the public directory
    if (!filePath.startsWith(path.join(process.cwd(), 'public', 'animations'))) {
      return res.status(400).json({ error: 'Invalid path' })
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Animation not found' })
    }
    
    // Read and send the file
    const fileContents = fs.readFileSync(filePath, 'utf8')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(fileContents)
  } catch (error) {
    console.error('Error serving animation:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
