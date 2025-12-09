// Event-related animations
export const animations = {
  // Loading animation (while fetching events)
  loading: {
    url: 'https://assets3.lottiefiles.com/private_files/lf30_7Wc9my.json',
    description: 'Smooth loading animation with a calendar and checkmarks',
  },
  
  // Empty state (no events found)
  emptyEvents: {
    url: 'https://assets10.lottiefiles.com/packages/lf20_afwjhfb2.json',
    description: 'Empty calendar with a magnifying glass',
  },
  
  // Event creation success
  success: {
    url: 'https://assets4.lottiefiles.com/packages/lf20_x62chJ.json',
    description: 'Confetti animation with success checkmark',
  },
  
  // Event categories
  categories: {
    music: {
      url: 'https://assets1.lottiefiles.com/packages/lf20_osdxlxsc.json',
      description: 'Music notes animation',
    },
    food: {
      url: 'https://assets6.lottiefiles.com/packages/lf20_0skurerf.json',
      description: 'Food and drink animation',
    },
    sports: {
      url: 'https://assets6.lottiefiles.com/packages/lf20_5tkzkblw.json',
      description: 'Sports balls animation',
    },
    tech: {
      url: 'https://assets2.lottiefiles.com/packages/lf20_3vbOcw.json',
      description: 'Tech/coding animation',
    },
  },
  
  // UI elements
  ui: {
    search: {
      url: 'https://assets1.lottiefiles.com/packages/lf20_0y4bh6k1.json',
      description: 'Search animation with magnifying glass',
    },
    location: {
      url: 'https://assets1.lottiefiles.com/packages/lf20_0s3elz2y.json',
      description: 'Location pin animation',
    },
    calendar: {
      url: 'https://assets5.lottiefiles.com/packages/lf20_7skrnzge.json',
      description: 'Calendar with date selection',
    },
  },
  
  // Hero section animations
  hero: {
    celebration: {
      url: 'https://assets4.lottiefiles.com/packages/lf20_5tkzkblw.json',
      description: 'Confetti celebration',
    },
    eventPlanning: {
      url: 'https://assets1.lottiefiles.com/packages/lf20_osdxlxsc.json',
      description: 'Event planning process',
    },
  },
}

// Animation presets for different use cases
export const animationPresets = {
  loading: {
    loop: true,
    autoplay: true,
    speed: 1,
    className: 'w-12 h-12',
  },
  hero: {
    loop: true,
    autoplay: true,
    speed: 1,
    className: 'w-full h-64 md:h-80',
  },
  category: {
    loop: true,
    autoplay: true,
    speed: 1,
    className: 'w-16 h-16',
  },
  success: {
    loop: false,
    autoplay: true,
    speed: 1,
    className: 'w-32 h-32',
  },
}

// Helper to get animation data by key
export const getAnimation = (key: string) => {
  const keys = key.split('.')
  let result = animations as any
  
  for (const k of keys) {
    result = result?.[k]
    if (!result) return null
  }
  
  return result
}
