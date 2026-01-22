# Neumorphic-Flat Hybrid Design System

## Overview
This design system implements a modern neumorphic-flat hybrid style with minimal UI illustrations throughout the Event Planner application.

## Core Principles

### 1. Neumorphic Elements
- Soft shadows that create depth
- Subtle gradients for dimension
- Rounded corners (12px - 24px)
- Light background with minimal contrast

### 2. Flat Design
- Clean, minimal icons
- Simple color palette
- Clear typography hierarchy
- Focused user experience

### 3. Color Palette

#### Primary Colors
- **Indigo**: `#6366f1` - Primary actions, main brand
- **Purple**: `#8b5cf6` - Accents, secondary elements
- **Violet**: `#a855f7` - Gradients, highlights

#### Semantic Colors
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#f43f5e` (Rose)
- **Info**: `#0ea5e9` (Sky)

#### Neutral Colors
- **Slate**: `#64748b` - Text, borders
- **White**: `#ffffff` - Backgrounds
- **Gray**: `#f8fafc` - Secondary backgrounds

## Components

### 1. NeumorphicIcon
Neumorphic-styled icon containers with soft shadows and gradients.

```tsx
import { NeumorphicIcon } from '@/components/ui/neumorphic-icon'
import { Calendar } from 'lucide-react'

<NeumorphicIcon 
  icon={Calendar} 
  variant="primary" 
  size="md" 
/>
```

**Props:**
- `icon`: LucideIcon - The icon to display
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `className`: string (optional)

### 2. StatCard
Dashboard statistics card with neumorphic styling.

```tsx
import { StatCard } from '@/components/ui/stat-card'
import { Users } from 'lucide-react'

<StatCard
  title="Total Users"
  value={1234}
  icon={Users}
  variant="success"
  trend={{ value: 12, isPositive: true }}
/>
```

**Props:**
- `title`: string - Card title
- `value`: string | number - Main value to display
- `icon`: LucideIcon - Icon for the card
- `variant`: Color variant
- `trend`: { value: number, isPositive: boolean } (optional)

### 3. MinimalIllustration
Minimal SVG illustrations for empty states and feedback.

```tsx
import { MinimalIllustration } from '@/components/ui/minimal-illustration'

<MinimalIllustration 
  type="no-events" 
  size="md" 
/>
```

**Types:**
- `empty-state` - Generic empty state
- `success` - Success confirmation
- `error` - Error state
- `loading` - Loading state
- `no-events` - No events found
- `no-registrations` - No registrations
- `calendar` - Calendar/schedule
- `analytics` - Analytics/charts

### 4. NeumorphicButton
Buttons with neumorphic styling and animations.

```tsx
import { NeumorphicButton } from '@/components/ui/neumorphic-button'
import { Plus } from 'lucide-react'

<NeumorphicButton
  variant="primary"
  size="md"
  icon={Plus}
  onClick={handleClick}
>
  Create Event
</NeumorphicButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: LucideIcon (optional)
- `disabled`: boolean
- `type`: 'button' | 'submit' | 'reset'

## Shadow System

### Neumorphic Shadows
```css
/* Raised element */
shadow-[8px_8px_16px_rgba(99,102,241,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]

/* Pressed/Inset element */
shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(99,102,241,0.15)]

/* Hover state */
shadow-[12px_12px_24px_rgba(99,102,241,0.15),-12px_-12px_24px_rgba(255,255,255,1)]
```

## Typography

### Font Sizes
- **Heading 1**: `text-3xl` (30px) - Page titles
- **Heading 2**: `text-2xl` (24px) - Section titles
- **Heading 3**: `text-xl` (20px) - Card titles
- **Body**: `text-base` (16px) - Regular text
- **Small**: `text-sm` (14px) - Secondary text
- **Tiny**: `text-xs` (12px) - Labels, captions

### Font Weights
- **Bold**: `font-bold` (700) - Headings, emphasis
- **Semibold**: `font-semibold` (600) - Subheadings
- **Medium**: `font-medium` (500) - Labels
- **Regular**: `font-normal` (400) - Body text

## Spacing

### Border Radius
- **Small**: `rounded-lg` (8px) - Inputs, small cards
- **Medium**: `rounded-2xl` (16px) - Buttons, cards
- **Large**: `rounded-3xl` (24px) - Large cards, containers

### Padding
- **Small**: `p-4` (16px)
- **Medium**: `p-6` (24px)
- **Large**: `p-8` (32px)

### Gaps
- **Small**: `gap-2` (8px)
- **Medium**: `gap-4` (16px)
- **Large**: `gap-6` (24px)

## Usage Examples

### Dashboard Card
```tsx
<div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-8 border border-indigo-100 shadow-[8px_8px_24px_rgba(99,102,241,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
  <div className="flex items-center gap-4">
    <NeumorphicIcon icon={Calendar} variant="primary" size="lg" />
    <div>
      <h3 className="text-xl font-bold text-slate-900">Upcoming Events</h3>
      <p className="text-sm text-slate-600">5 events this week</p>
    </div>
  </div>
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <MinimalIllustration type="no-events" size="lg" />
  <h3 className="text-xl font-bold text-slate-900 mt-6">No Events Yet</h3>
  <p className="text-sm text-slate-600 mt-2">Create your first event to get started</p>
  <NeumorphicButton variant="primary" icon={Plus} className="mt-6">
    Create Event
  </NeumorphicButton>
</div>
```

## Animation Guidelines

### Transitions
- **Duration**: 300ms for most interactions
- **Easing**: `ease-in-out` for smooth animations
- **Hover**: Scale 1.02-1.05 for subtle lift
- **Active**: Scale 0.95-0.98 for press effect

### Motion
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

## Accessibility

- Maintain 4.5:1 contrast ratio for text
- Use semantic HTML elements
- Include ARIA labels for icons
- Ensure keyboard navigation works
- Test with screen readers

## Best Practices

1. **Consistency**: Use the same variant for similar actions across the app
2. **Hierarchy**: Use size and color to establish visual hierarchy
3. **Spacing**: Maintain consistent spacing between elements
4. **Feedback**: Provide visual feedback for all interactions
5. **Performance**: Optimize animations for 60fps
6. **Responsiveness**: Ensure components work on all screen sizes

## Migration Guide

To migrate existing components:

1. Replace standard buttons with `NeumorphicButton`
2. Update stat cards to use `StatCard` component
3. Add `MinimalIllustration` to empty states
4. Wrap icons with `NeumorphicIcon` for consistency
5. Update shadow classes to neumorphic style
6. Apply gradient backgrounds to containers

## Resources

- Lucide Icons: https://lucide.dev
- Tailwind CSS: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion
