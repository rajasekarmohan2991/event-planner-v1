// Animation configurations for different event categories
export interface AnimationConfig {
  id: string;
  name: string;
  source: string; // URL to the animation file (Lottie/JSON)
  author: string;
  license: string;
  category: string[];
  preview: string; // URL to preview
}

export const EVENT_ANIMATIONS: Record<string, AnimationConfig[]> = {
  'Art & Photos': [
    {
      id: 'art-gallery',
      name: 'Art Gallery Showcase',
      source: 'https://assets8.lottiefiles.com/packages/lf20_6wutsrox.json',
      author: 'LottieFiles',
      license: 'CC0',
      category: ['Art & Photos', 'Exhibition'],
      preview: 'https://lottiefiles.com/animations/art-gallery-showcase-6wutsrox'
    },
    // Add more art-related animations
  ],
  'Business': [
    {
      id: 'business-meeting',
      name: 'Business Meeting',
      source: 'https://assets8.lottiefiles.com/packages/lf20_uwWgUEcJRr.json',
      author: 'LottieFiles',
      license: 'CC0',
      category: ['Business', 'Meeting', 'Conference'],
      preview: 'https://lottiefiles.com/animations/business-meeting-uwWgUEcJRr'
    },
    // Add more business-related animations
  ],
  'Education': [
    {
      id: 'online-education',
      name: 'Online Education',
      source: 'https://assets8.lottiefiles.com/packages/lf20_0f8k3t6y.json',
      author: 'LottieFiles',
      license: 'CC0',
      category: ['Education', 'Workshop', 'Webinar'],
      preview: 'https://lottiefiles.com/animations/online-education-0f8k3t6y'
    },
    // Add more education-related animations
  ],
  'Technology': [
    {
      id: 'tech-connect',
      name: 'Tech Connect',
      source: 'https://assets8.lottiefiles.com/packages/lf20_6wutsrox.json',
      author: 'LottieFiles',
      license: 'CC0',
      category: ['Technology', 'Conference', 'Networking'],
      preview: 'https://lottiefiles.com/animations/tech-connect-6wutsrox'
    },
    // Add more tech-related animations
  ],
  // Add more categories as needed
};

// Default animation for events without a specific category
export const DEFAULT_ANIMATION: AnimationConfig = {
  id: 'default-event',
  name: 'Default Event',
  source: 'https://assets8.lottiefiles.com/packages/lf20_6wutsrox.json',
  author: 'LottieFiles',
  license: 'CC0',
  category: ['General'],
  preview: 'https://lottiefiles.com/animations/default-event-6wutsrox'
};

// Get animations by category
export function getAnimationsByCategory(category: string): AnimationConfig[] {
  return EVENT_ANIMATIONS[category] || [];
}

// Get all available categories
export function getAvailableCategories(): string[] {
  return Object.keys(EVENT_ANIMATIONS);
}

// Find animation by ID
export function getAnimationById(id: string): AnimationConfig | null {
  for (const category in EVENT_ANIMATIONS) {
    const animation = EVENT_ANIMATIONS[category].find(anim => anim.id === id);
    if (animation) return animation;
  }
  return null;
}
