# 🎨 Event Planner - Modern Design System V2

## 🌈 Color Palette

### Primary Colors (Vibrant & Celebratory)
```css
--color-primary: #6366F1        /* Indigo - Trust & Professionalism */
--color-primary-light: #818CF8  /* Light Indigo */
--color-primary-dark: #4F46E5   /* Dark Indigo */

--color-secondary: #EC4899      /* Pink - Celebration & Joy */
--color-secondary-light: #F472B6
--color-secondary-dark: #DB2777

--color-accent: #F59E0B         /* Amber - Energy & Warmth */
--color-accent-light: #FBBF24
--color-accent-dark: #D97706

--color-success: #10B981        /* Emerald - Success */
--color-warning: #F59E0B        /* Amber - Warning */
--color-error: #EF4444          /* Red - Error */
--color-info: #3B82F6           /* Blue - Info */
```

### Dark Mode Colors
```css
/* Background Layers */
--dark-bg-primary: #0F172A      /* Deep Navy - Slate 900 */
--dark-bg-secondary: #1E293B    /* Slate 800 */
--dark-bg-tertiary: #334155     /* Slate 700 */
--dark-bg-elevated: #1E293B     /* Cards/Elevated surfaces */

/* Pastel Accents for Dark Mode */
--dark-accent-purple: #C4B5FD   /* Purple 300 */
--dark-accent-pink: #F9A8D4     /* Pink 300 */
--dark-accent-blue: #93C5FD     /* Blue 300 */
--dark-accent-green: #86EFAC    /* Green 300 */
--dark-accent-amber: #FCD34D    /* Amber 300 */

/* Text Colors */
--dark-text-primary: #F1F5F9    /* Slate 100 */
--dark-text-secondary: #CBD5E1  /* Slate 300 */
--dark-text-muted: #94A3B8      /* Slate 400 */
```

### Light Mode Colors
```css
/* Background Layers */
--light-bg-primary: #FFFFFF
--light-bg-secondary: #F8FAFC   /* Slate 50 */
--light-bg-tertiary: #F1F5F9    /* Slate 100 */

/* Text Colors */
--light-text-primary: #0F172A   /* Slate 900 */
--light-text-secondary: #475569 /* Slate 600 */
--light-text-muted: #94A3B8     /* Slate 400 */
```

## 📐 Spacing Scale
```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-7: 28px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

## 🔤 Typography

### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-heading: 'Poppins', sans-serif
--font-mono: 'JetBrains Mono', monospace
```

### Font Sizes
```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
--text-6xl: 3.75rem     /* 60px */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### Line Heights
```css
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

## 🎭 Shadows & Depth

### Shadows
```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Colored Shadows for Cards */
--shadow-indigo: 0 10px 25px -5px rgba(99, 102, 241, 0.2)
--shadow-pink: 0 10px 25px -5px rgba(236, 72, 153, 0.2)
--shadow-amber: 0 10px 25px -5px rgba(245, 158, 11, 0.2)
```

### Dark Mode Shadows
```css
--dark-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3)
--dark-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4)
--dark-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5)
--dark-shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3)
```

## 📏 Border Radius
```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-full: 9999px
```

## 🎨 Gradients

### Primary Gradients
```css
--gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
--gradient-secondary: linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)
--gradient-success: linear-gradient(135deg, #10B981 0%, #3B82F6 100%)
--gradient-warm: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)
--gradient-cool: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)
```

### Mesh Gradients (Celebration Background)
```css
--gradient-mesh: 
  radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.15) 0, transparent 50%),
  radial-gradient(at 80% 0%, rgba(236, 72, 153, 0.15) 0, transparent 50%),
  radial-gradient(at 0% 50%, rgba(245, 158, 11, 0.15) 0, transparent 50%),
  radial-gradient(at 80% 50%, rgba(16, 185, 129, 0.15) 0, transparent 50%),
  radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.15) 0, transparent 50%),
  radial-gradient(at 80% 100%, rgba(139, 92, 246, 0.15) 0, transparent 50%)
```

## 🎬 Animations & Transitions

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Durations
```css
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
--duration-slower: 500ms
```

### Micro-Animations
```css
/* Card Hover */
.card-hover {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Button Press */
.button-press:active {
  transform: scale(0.98);
}

/* Shimmer Effect */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Float */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Confetti Fall */
@keyframes confetti-fall {
  0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}
```

## 🎴 Component Patterns

### Cards
```css
.card-base {
  background: var(--light-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-elevated {
  background: var(--light-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  border: none;
}

.card-gradient {
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  color: white;
  box-shadow: var(--shadow-indigo);
}
```

### Buttons
```css
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-out);
}

.btn-primary:hover {
  box-shadow: var(--shadow-indigo);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  color: var(--color-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-primary);
  font-weight: var(--font-semibold);
}
```

## 🎯 Dashboard Layout

### Grid System
```css
.dashboard-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.dashboard-stats {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

### Celebration Elements
```css
/* Background Pattern */
.celebration-bg {
  background: 
    var(--gradient-mesh),
    linear-gradient(180deg, var(--light-bg-primary) 0%, var(--light-bg-secondary) 100%);
}

/* Confetti Shapes (SVG/CSS) */
.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--color-secondary);
  animation: confetti-fall 3s linear infinite;
}
```

## 🌙 Dark Mode Specifics

### Card in Dark Mode
```css
.dark .card-base {
  background: var(--dark-bg-elevated);
  box-shadow: var(--dark-shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .card-elevated {
  background: var(--dark-bg-elevated);
  box-shadow: var(--dark-shadow-lg);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.dark .card-gradient {
  background: var(--gradient-primary);
  box-shadow: var(--dark-shadow-glow);
}
```

## 📱 Responsive Breakpoints
```css
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

## ✨ Design Principles

1. **Friendly First**: Warm colors, rounded corners, approachable language
2. **Trust Through Clarity**: Clear hierarchy, consistent patterns, predictable interactions
3. **Celebration in Motion**: Subtle animations, confetti accents, gradient overlays
4. **Professional Foundation**: Clean layouts, proper spacing, readable typography
5. **Accessibility**: High contrast ratios, keyboard navigation, screen reader support

## 🎨 Color Usage Guidelines

### Primary (Indigo)
- Main CTAs
- Navigation highlights
- Important actions

### Secondary (Pink)
- Celebration moments
- Success states
- Featured content

### Accent (Amber)
- Warnings
- Highlights
- Call-outs

### Use Gradients For:
- Hero sections
- Primary CTAs
- Featured cards
- Success states

### Use Solid Colors For:
- Text
- Icons
- Borders
- Backgrounds
