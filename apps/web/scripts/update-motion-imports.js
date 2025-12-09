#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Files to process
const extensions = ['.ts', '.tsx', '.js', '.jsx']
const rootDir = path.join(__dirname, '../')

// Patterns to search for and their replacements
const patterns = [
  {
    // Fix direct imports from framer-motion/dist
    regex: /from ['"]framer-motion\/dist\/([^'"\s]*)['"]/g,
    replacement: 'from "framer-motion"',
  },
  {
    // Fix specific motion component imports
    regex: /import\s*\{\s*([^}]*?motion\.[^}]*?)\s*\}\s*from\s*['"]framer-motion['"]/g,
    replacement: 'import { $1 } from "framer-motion"',
  },
  {
    // Fix default imports
    regex: /import\s+([^\s,{}]+)\s+from\s*['"]framer-motion\/dist\/[^'"\s]*['"]/g,
    replacement: 'import { $1 } from "framer-motion"',
  },
]

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    patterns.forEach(({ regex, replacement }) => {
      const newContent = content.replace(regex, replacement)
      if (newContent !== content) {
        updated = true
        content = newContent
      }
    })

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`)
      return true
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
  }
  return false
}

// Find all files with the given extensions
function findFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)

  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file === 'node_modules' || file === '.next') {
        return
      }
      results = results.concat(findFiles(filePath))
    } else if (extensions.includes(path.extname(file).toLowerCase())) {
      results.push(filePath)
    }
  })

  return results
}

// Format files using Prettier
function formatFiles(files) {
  if (files.length === 0) return
  
  try {
    console.log('\n🎨 Formatting files with Prettier...')
    execSync(`npx prettier --write ${files.join(' ')}`, { stdio: 'inherit' })
  } catch (error) {
    console.error('Error formatting files:', error.message)
  }
}

// Main function
function main() {
  console.log('🔍 Searching for files to update...')
  const files = findFiles(rootDir)
  console.log(`📁 Found ${files.length} files to process`)

  const updatedFiles = []
  files.forEach((file) => {
    if (processFile(file)) {
      updatedFiles.push(file)
    }
  })

  if (updatedFiles.length > 0) {
    console.log(`\n✨ Updated ${updatedFiles.length} files`)
    formatFiles(updatedFiles)
  } else {
    console.log('\n✅ No files needed updating')
  }
}

// Run the script
main()
