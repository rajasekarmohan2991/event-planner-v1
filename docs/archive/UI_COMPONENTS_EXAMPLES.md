# 🎨 Event Planner - UI Components & Usage Examples

## 📦 Available Components

### 1. **ModernDashboard** Component
A complete, modern dashboard with animated stats cards and celebration theme.

**Location:** `/apps/web/components/dashboard/ModernDashboard.tsx`

**Features:**
- ✨ Animated background with floating gradient orbs
- 📊 Real-time stats cards with colored shadows
- 🎉 Create Event CTA with gradient animation
- 📅 Recent events grid with hover effects
- 🌙 Full dark mode support

**Usage:**
```tsx
import ModernDashboard from '@/components/dashboard/ModernDashboard'

export default function DashboardPage() {
  return <ModernDashboard />
}
```

---

## 🎨 Design Tokens (Available via Tailwind)

### Colors
```tsx
// Primary Brand Colors
className="bg-brand-500 text-white"
className="text-brand-600"
className="border-brand-400"

// Celebration Colors
className="bg-celebration-500 text-white"
className="text-celebration-600"

// Energy/Accent Colors
className="bg-energy-500 text-white"
className="text-energy-600"
```

### Shadows
```tsx
className="shadow-soft"        // Subtle shadow
className="shadow-medium"      // Medium shadow
className="shadow-large"       // Large shadow
className="shadow-brand"       // Brand-colored shadow
className="shadow-celebration" // Pink-colored shadow
className="shadow-energy"      // Amber-colored shadow
```

### Border Radius
```tsx
className="rounded-lg"   // 12px
className="rounded-xl"   // 16px
className="rounded-2xl"  // 20px
className="rounded-3xl"  // 24px
```

### Animations
```tsx
className="animate-float"      // Floating animation
className="animate-shimmer"    // Shimmer effect
className="animate-pulse-soft" // Soft pulse
className="animate-fade-in"    // Fade in
className="animate-slide-up"   // Slide up
className="animate-confetti"   // Confetti fall
```

---

## 🎯 Pre-built Component Classes

### Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Create Event
</button>
```

#### Secondary Button
```tsx
<button className="btn-secondary">
  Save Draft
</button>
```

#### Ghost Button
```tsx
<button className="btn-ghost">
  Cancel
</button>
```

#### Outline Button
```tsx
<button className="btn-outline">
  Learn More
</button>
```

### Cards

#### Modern Card
```tsx
<div className="card-modern">
  <h3 className="text-xl font-semibold mb-2">Event Title</h3>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</div>
```

#### Gradient Card
```tsx
<div className="card-gradient">
  <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
  <p className="text-white/90">Special content</p>
</div>
```

#### Floating Card (with hover effect)
```tsx
<div className="card-modern card-float">
  Hovering lifts this card up
</div>
```

#### Glass Card (frosted glass effect)
```tsx
<div className="glass-card p-6">
  Transparent with blur
</div>
```

### Input Fields

```tsx
<input 
  type="text"
  className="input-modern"
  placeholder="Enter event name..."
/>
```

### Badges

```tsx
<span className="badge-brand">New</span>
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Cancelled</span>
```

---

## 🎨 Complete Page Examples

### Example 1: Stats Dashboard

```tsx
export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-4xl font-heading font-bold text-gradient-brand mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your event performance in real-time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-modern card-float">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-brand">
                <svg className="w-6 h-6 text-white" />
              </div>
              <span className="badge-success">+12%</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Views</p>
            <p className="text-3xl font-bold font-heading">12,543</p>
          </div>

          {/* More stat cards... */}
        </div>
      </div>
    </div>
  )
}
```

### Example 2: Event Card Grid

```tsx
export default function EventsGrid({ events }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <div 
          key={event.id}
          className="card-modern card-float cursor-pointer group animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Event Image */}
          <div className="relative h-48 bg-gradient-to-br from-brand-500 to-celebration-500 rounded-xl mb-4 overflow-hidden">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Event Content */}
          <h3 className="text-xl font-semibold mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {event.name}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <svg className="w-4 h-4" />
            <span>{event.date}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="badge-brand">{event.category}</span>
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
              View Details →
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Example 3: Form with Modern Inputs

```tsx
export default function CreateEventForm() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="card-modern">
        <h2 className="text-2xl font-heading font-bold mb-6 text-gradient-brand">
          Create New Event
        </h2>

        <form className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Event Name
            </label>
            <input 
              type="text"
              className="input-modern"
              placeholder="Amazing Conference 2024"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea 
              className="input-modern"
              rows={4}
              placeholder="Tell us about your event..."
            />
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date
              </label>
              <input 
                type="date"
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location
              </label>
              <input 
                type="text"
                className="input-modern"
                placeholder="City, Venue"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Event
            </button>
            <button type="button" className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🎭 Advanced Effects

### Celebration Background with Confetti

```tsx
export default function CelebrationPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-500 to-celebration-500 overflow-hidden">
      {/* Confetti Elements */}
      <div className="confetti confetti-1" />
      <div className="confetti confetti-2" />
      <div className="confetti confetti-3" />
      <div className="confetti confetti-4" />
      <div className="confetti confetti-5" />
      <div className="confetti confetti-6" />
      <div className="confetti confetti-7" />
      <div className="confetti confetti-8" />
      <div className="confetti confetti-9" />
      <div className="confetti confetti-10" />

      {/* Content */}
      <div className="relative z-10 p-8">
        <h1 className="text-6xl font-heading font-bold text-white text-center">
          🎉 Event Published Successfully! 🎉
        </h1>
      </div>
    </div>
  )
}
```

### Animated Gradient Background

```tsx
<div className="bg-animated-gradient min-h-screen">
  <div className="backdrop-blur-sm bg-white/10 p-8">
    {/* Your content */}
  </div>
</div>
```

### Glass Morphism Effect

```tsx
<div className="relative min-h-screen overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-celebration-500" />
  
  {/* Glass Card */}
  <div className="relative z-10 p-8 max-w-4xl mx-auto">
    <div className="glass p-8 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-4">
        Transparent Card with Backdrop Blur
      </h2>
      <p className="text-white/90">
        This creates a beautiful frosted glass effect
      </p>
    </div>
  </div>
</div>
```

### Text Gradients

```tsx
<h1 className="text-gradient-brand text-5xl font-bold">
  Brand Gradient Text
</h1>

<h2 className="text-gradient-celebration text-4xl font-bold">
  Celebration Gradient
</h2>

<h3 className="text-gradient-rainbow text-3xl font-bold">
  Rainbow Gradient
</h3>
```

---

## 🎯 Layout Patterns

### Hero Section with CTA

```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Animated Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
    <div className="absolute top-20 right-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-20 left-20 w-96 h-96 bg-celebration-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
  </div>

  {/* Content */}
  <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 rounded-full mb-6 animate-pulse-soft">
      <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
        ✨ New Feature Available
      </span>
    </div>

    <h1 className="text-6xl md:text-7xl font-heading font-bold mb-6 animate-slide-up">
      <span className="text-gradient-rainbow">
        Plan Amazing Events
      </span>
    </h1>

    <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      Create, manage, and track your events with our all-in-one platform
    </p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <button className="btn-primary text-lg px-8 py-4">
        Get Started Free
      </button>
      <button className="btn-ghost text-lg px-8 py-4">
        Watch Demo
      </button>
    </div>
  </div>
</section>
```

### Feature Grid

```tsx
<section className="py-20 px-4">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-4xl font-heading font-bold text-center mb-12 text-gradient-brand">
      Powerful Features
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature, i) => (
        <div 
          key={i}
          className="card-modern card-float text-center animate-slide-up"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-brand">
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## 💡 Pro Tips

### 1. **Combine Effects for Maximum Impact**
```tsx
<div className="card-modern card-float hover:shadow-brand transition-all duration-300 hover:scale-105">
  Interactive card with multiple hover effects
</div>
```

### 2. **Use Animation Delays for Stagger Effect**
```tsx
{items.map((item, index) => (
  <div 
    key={item.id}
    className="animate-slide-up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    {item.content}
  </div>
))}
```

### 3. **Layer Gradients for Depth**
```tsx
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-celebration-500/20 blur-3xl" />
  <div className="relative">Content here</div>
</div>
```

### 4. **Dark Mode Considerations**
```tsx
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
  Always provide dark mode variants
</div>
```

---

## 🚀 Quick Start Checklist

- [x] ✅ Tailwind config updated with design tokens
- [x] ✅ Global CSS with animations and components
- [x] ✅ ModernDashboard component created
- [x] ✅ Google Fonts (Inter & Poppins) imported
- [x] ✅ Custom shadows and colors defined
- [x] ✅ Animation keyframes configured
- [x] ✅ Component classes ready to use

## 🎨 Design Philosophy

**Vibrant yet Professional**: Use bold colors (brand, celebration, energy) but maintain readability and hierarchy

**Smooth & Delightful**: All interactions have transitions. Cards float on hover. Buttons scale when pressed.

**Celebration Focused**: Confetti, gradients, and playful animations convey joy while maintaining trust

**Dark Mode First**: Every component looks great in both light and dark themes

**Performance**: Animations use GPU-accelerated properties (transform, opacity) for smooth 60fps

---

Ready to build something beautiful! 🎉✨
