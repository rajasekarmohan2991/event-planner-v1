/**
 * Format event mode for display
 * Converts IN_PERSON, VIRTUAL, HYBRID to proper case
 */
export function formatEventMode(mode: string | undefined | null): string {
  if (!mode) return ''
  
  const modeMap: Record<string, string> = {
    'IN_PERSON': 'In Person',
    'VIRTUAL': 'Virtual',
    'HYBRID': 'Hybrid'
  }
  
  return modeMap[mode.toUpperCase()] || mode
}

/**
 * Get event mode badge color
 */
export function getEventModeBadgeColor(mode: string | undefined | null): string {
  if (!mode) return 'bg-gray-100 text-gray-800'
  
  const colorMap: Record<string, string> = {
    'IN_PERSON': 'bg-blue-100 text-blue-800',
    'VIRTUAL': 'bg-purple-100 text-purple-800',
    'HYBRID': 'bg-green-100 text-green-800'
  }
  
  return colorMap[mode.toUpperCase()] || 'bg-gray-100 text-gray-800'
}
