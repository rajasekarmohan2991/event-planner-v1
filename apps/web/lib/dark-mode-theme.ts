/**
 * Professional Dark Mode Theme Configuration
 * High-standard color palette with proper contrast ratios
 */

export const darkModeColors = {
    // Background layers (from darkest to lightest)
    bg: {
        primary: '#0a0e1a',      // Main background - Deep navy
        secondary: '#111827',    // Card/panel background
        tertiary: '#1f2937',     // Elevated elements
        hover: '#374151',        // Hover states
        active: '#4b5563',       // Active states
    },

    // Text colors (WCAG AAA compliant)
    text: {
        primary: '#f9fafb',      // Main text - Near white
        secondary: '#d1d5db',    // Secondary text - Light gray
        tertiary: '#9ca3af',     // Muted text - Medium gray
        disabled: '#6b7280',     // Disabled text - Dark gray
    },

    // Border colors
    border: {
        primary: '#374151',      // Main borders
        secondary: '#4b5563',    // Elevated borders
        focus: '#6366f1',        // Focus rings
    },

    // Brand colors (adjusted for dark mode)
    brand: {
        primary: '#6366f1',      // Indigo - Primary actions
        primaryHover: '#7c3aed', // Purple - Hover state
        secondary: '#ec4899',    // Pink - Accents
        success: '#10b981',      // Green - Success states
        warning: '#f59e0b',      // Amber - Warnings
        error: '#ef4444',        // Red - Errors
        info: '#3b82f6',         // Blue - Info
    },

    // Sidebar specific
    sidebar: {
        bg: '#0f172a',           // Sidebar background
        hover: '#1e293b',        // Hover state
        active: '#7c3aed',       // Active item
        text: '#e2e8f0',         // Text color
        textMuted: '#94a3b8',    // Muted text
    },

    // Input fields
    input: {
        bg: '#1f2937',
        border: '#374151',
        focus: '#4b5563',
        text: '#f9fafb',
        placeholder: '#6b7280',
    },
}

/**
 * Tailwind dark mode classes
 * Use these for consistent dark mode styling
 */
export const darkModeClasses = {
    // Backgrounds
    bgPrimary: 'bg-white dark:bg-[#0a0e1a]',
    bgSecondary: 'bg-gray-50 dark:bg-[#111827]',
    bgTertiary: 'bg-gray-100 dark:bg-[#1f2937]',
    bgHover: 'hover:bg-gray-100 dark:hover:bg-[#374151]',

    // Text
    textPrimary: 'text-gray-900 dark:text-gray-50',
    textSecondary: 'text-gray-700 dark:text-gray-300',
    textTertiary: 'text-gray-600 dark:text-gray-400',
    textMuted: 'text-gray-500 dark:text-gray-500',

    // Borders
    border: 'border-gray-200 dark:border-gray-700',
    borderHover: 'hover:border-gray-300 dark:hover:border-gray-600',

    // Cards
    card: 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700',

    // Buttons
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white',
    btnSecondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',

    // Inputs
    input: 'bg-white dark:bg-[#1f2937] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
}
