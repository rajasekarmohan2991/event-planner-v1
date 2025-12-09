# 🎨 Event Planner Design System

## 🌈 Color Palette

### Light Mode
```css
/* Primary - Celebration Purple/Indigo */
--primary-50: #F5F3FF
--primary-100: #EDE9FE
--primary-200: #DDD6FE
--primary-300: #C4B5FD
--primary-400: #A78BFA
--primary-500: #8B5CF6  /* Main brand color */
--primary-600: #7C3AED
--primary-700: #6D28D9
--primary-800: #5B21B6
--primary-900: #4C1D95

/* Secondary - Celebration Pink */
--secondary-50: #FDF2F8
--secondary-100: #FCE7F3
--secondary-200: #FBCFE8
--secondary-300: #F9A8D4
--secondary-400: #F472B6
--secondary-500: #EC4899  /* Accent color */
--secondary-600: #DB2777
--secondary-700: #BE185D
--secondary-800: #9D174D
--secondary-900: #831843

/* Accent - Warm Orange */
--accent-50: #FFF7ED
--accent-100: #FFEDD5
--accent-200: #FED7AA
--accent-300: #FDBA74
--accent-400: #FB923C
--accent-500: #F97316  /* CTA color */
--accent-600: #EA580C
--accent-700: #C2410C
--accent-800: #9A3412
--accent-900: #7C2D12

/* Success - Fresh Green */
--success-500: #10B981
--success-600: #059669

/* Warning - Golden Yellow */
--warning-500: #F59E0B
--warning-600: #D97706

/* Error - Vibrant Red */
--error-500: #EF4444
--error-600: #DC2626

/* Neutrals - Cool Grays */
--neutral-50: #F9FAFB
--neutral-100: #F3F4F6
--neutral-200: #E5E7EB
--neutral-300: #D1D5DB
--neutral-400: #9CA3AF
--neutral-500: #6B7280
--neutral-600: #4B5563
--neutral-700: #374151
--neutral-800: #1F2937
--neutral-900: #111827

/* Backgrounds */
--bg-gradient-start: #F9FAFB
--bg-gradient-end: #FFFFFF
--card-bg: rgba(255, 255, 255, 0.9)
--overlay: rgba(0, 0, 0, 0.5)
```

### Dark Mode
```css
/* Dark Mode Base */
--dark-bg-primary: #0F172A    /* Deep navy */
--dark-bg-secondary: #1E293B
--dark-bg-tertiary: #334155

/* Dark Mode Cards */
--dark-card-bg: rgba(30, 41, 59, 0.8)
--dark-card-border: rgba(148, 163, 184, 0.1)

/* Dark Mode Text */
--dark-text-primary: #F1F5F9
--dark-text-secondary: #CBD5E1
--dark-text-tertiary: #94A3B8

/* Pastel Accents for Dark Mode */
--dark-primary: #A78BFA   /* Softer purple */
--dark-secondary: #F9A8D4  /* Softer pink */
--dark-accent: #FDBA74     /* Softer orange */
```

## 🔤 Typography

### Font Stack
```css
/* Primary Font - Modern Sans Serif */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

/* Display Font - Headlines */
--font-display: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif

/* Monospace - Code/Numbers */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace
```

### Type Scale
```css
/* Font Sizes */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
--text-4xl: 2.25rem    /* 36px */
--text-5xl: 3rem       /* 48px */
--text-6xl: 3.75rem    /* 60px */

/* Font Weights */
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800

/* Line Heights */
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

## 📐 Spacing System

```css
/* Spacing Scale (8px base) */
--space-0: 0
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
--space-24: 6rem      /* 96px */
```

## 🔲 Border & Radius

```css
/* Border Radius */
--radius-sm: 0.375rem    /* 6px */
--radius-base: 0.5rem    /* 8px */
--radius-md: 0.75rem     /* 12px */
--radius-lg: 1rem        /* 16px */
--radius-xl: 1.5rem      /* 24px */
--radius-2xl: 2rem       /* 32px */
--radius-full: 9999px

/* Border Width */
--border-thin: 1px
--border-medium: 2px
--border-thick: 4px
```

## 🌟 Shadows

```css
/* Elevation System */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Colored Shadows (for cards/buttons) */
--shadow-primary: 0 8px 16px -4px rgba(139, 92, 246, 0.3)
--shadow-secondary: 0 8px 16px -4px rgba(236, 72, 153, 0.3)
--shadow-accent: 0 8px 16px -4px rgba(249, 115, 22, 0.3)

/* Inner Shadows */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)
```

## 🎭 Animations

```css
/* Duration */
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
--duration-slower: 500ms

/* Easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)

/* Transitions */
--transition-all: all var(--duration-normal) var(--ease-in-out)
--transition-colors: color var(--duration-normal) var(--ease-in-out), 
                     background-color var(--duration-normal) var(--ease-in-out),
                     border-color var(--duration-normal) var(--ease-in-out)
--transition-transform: transform var(--duration-normal) var(--ease-out)
```

## 🎨 Gradients

```css
/* Background Gradients */
--gradient-bg-light: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)
--gradient-bg-dark: linear-gradient(135deg, #0F172A 0%, #1E293B 100%)

/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)
--gradient-secondary: linear-gradient(135deg, #EC4899 0%, #DB2777 100%)
--gradient-accent: linear-gradient(135deg, #F97316 0%, #EA580C 100%)

/* Celebration Gradients */
--gradient-celebration: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)
--gradient-sunset: linear-gradient(135deg, #FDBA74 0%, #F472B6 50%, #A78BFA 100%)

/* Mesh Gradients (for hero sections) */
--gradient-mesh: radial-gradient(at 40% 20%, hsla(270, 70%, 70%, 0.5) 0, transparent 50%),
                 radial-gradient(at 80% 0%, hsla(330, 80%, 70%, 0.5) 0, transparent 50%),
                 radial-gradient(at 0% 50%, hsla(240, 70%, 85%, 0.5) 0, transparent 50%),
                 radial-gradient(at 80% 50%, hsla(20, 90%, 75%, 0.5) 0, transparent 50%),
                 radial-gradient(at 0% 100%, hsla(270, 80%, 80%, 0.5) 0, transparent 50%)
```

## 🎯 Components

### Button Variants
- **Primary**: Purple gradient with white text
- **Secondary**: Pink gradient with white text
- **Accent**: Orange gradient with white text
- **Outline**: Border only, transparent background
- **Ghost**: No border, transparent background, hover effect

### Card Styles
- **Floating**: White background, shadow-lg, rounded-xl
- **Elevated**: Subtle gradient background, shadow-xl
- **Outlined**: Border only, no shadow
- **Glass**: Backdrop blur with semi-transparent background

### Badge Styles
- **Status**: Small pills with colored backgrounds
- **Count**: Circular with gradient background
- **Tag**: Rounded rectangles with soft colors

## 🖼️ Background Patterns

### Light Mode Patterns
```css
/* Confetti Pattern */
--pattern-confetti: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238B5CF6' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")

/* Geometric Pattern */
--pattern-geometric: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EC4899' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
```

## 📱 Responsive Breakpoints

```css
/* Mobile First */
--screen-sm: 640px    /* Small devices */
--screen-md: 768px    /* Medium devices */
--screen-lg: 1024px   /* Large devices */
--screen-xl: 1280px   /* Extra large devices */
--screen-2xl: 1536px  /* 2X large devices */
```

## 🎨 Iconography

**Style**: Outline icons with rounded corners
**Library**: Lucide React (already in use)
**Sizes**: 
- xs: 16px
- sm: 20px
- base: 24px
- lg: 32px
- xl: 48px

**Colors**: Match with primary/secondary/accent palette
**States**: Solid fill on hover/active

## ♿ Accessibility

```css
/* Focus States */
--focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.3)
--focus-ring-offset: 2px

/* Contrast Ratios */
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Graphical objects: 3:1 minimum
```

## 🎪 Theme Variables (Tailwind Config)

Add to `tailwind.config.ts`:
```typescript
{
  colors: {
    primary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    celebration: {
      pink: '#EC4899',
      purple: '#8B5CF6',
      orange: '#F97316',
    }
  },
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    display: ['Poppins', 'sans-serif'],
  },
  borderRadius: {
    'card': '12px',
    'button': '8px',
  },
  boxShadow: {
    'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    'primary': '0 8px 16px -4px rgba(139, 92, 246, 0.3)',
  }
}
```
