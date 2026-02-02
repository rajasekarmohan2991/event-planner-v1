/**
 * Generate Category Images for Browse Events Page
 * 
 * This script creates placeholder images for event categories.
 * Since we can't use Canvas in Node without additional dependencies,
 * we'll create simple colored rectangles as SVG files.
 */

const fs = require('fs');
const path = require('path');

const categories = [
    { name: 'business', icon: '💼', colors: { start: '#2563eb', end: '#4f46e5' } },
    { name: 'technology', icon: '💻', colors: { start: '#06b6d4', end: '#2563eb' } },
    { name: 'art', icon: '🎨', colors: { start: '#a855f7', end: '#ec4899' } },
    { name: 'music', icon: '🎵', colors: { start: '#ec4899', end: '#ef4444' } },
    { name: 'food', icon: '🍔', colors: { start: '#f97316', end: '#dc2626' } },
    { name: 'sports', icon: '⚽', colors: { start: '#10b981', end: '#059669' } },
    { name: 'health', icon: '💪', colors: { start: '#14b8a6', end: '#10b981' } },
    { name: 'education', icon: '📚', colors: { start: '#eab308', end: '#f97316' } },
    { name: 'other', icon: '📌', colors: { start: '#6b7280', end: '#4b5563' } }
];

const outputDir = path.join(__dirname, '../apps/web/public/images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

categories.forEach(category => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${category.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${category.colors.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${category.colors.end};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background gradient -->
  <rect width="600" height="900" fill="url(#grad-${category.name})" />
  
  <!-- Dark overlay -->
  <rect width="600" height="900" fill="rgba(0,0,0,0.3)" />
  
  <!-- Icon (using text as emoji) -->
  <text x="300" y="400" font-size="180" text-anchor="middle" fill="rgba(255,255,255,0.9)">${category.icon}</text>
  
  <!-- Category name -->
  <text x="300" y="750" font-size="60" font-weight="bold" text-anchor="middle" fill="white" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</text>
</svg>`;

    const filename = `category-${category.name}.svg`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`✓ Generated ${filename}`);
});

console.log(`\n✅ All ${categories.length} category images generated successfully!`);
console.log(`📁 Location: ${outputDir}`);
console.log('\n💡 Note: These are SVG files. For WebP, open the HTML generator in a browser.');
