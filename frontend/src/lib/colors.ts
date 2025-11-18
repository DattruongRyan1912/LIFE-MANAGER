/**
 * Life Manager AI - Design System Colors
 * Centralized color constants for consistent theming
 */

export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: '#3b82f6',  // Blue 500
    dark: '#2563eb',     // Blue 600
    light: '#60a5fa',    // Blue 400
    lighter: '#93c5fd',  // Blue 300
  },
  
  secondary: {
    DEFAULT: '#8b5cf6',  // Violet 500
    dark: '#7c3aed',     // Violet 600
    light: '#a78bfa',    // Violet 400
  },
  
  accent: {
    DEFAULT: '#06b6d4',  // Cyan 500
    dark: '#0891b2',     // Cyan 600
    light: '#22d3ee',    // Cyan 400
  },

  // Semantic Colors
  success: {
    DEFAULT: '#10b981',  // Green 500
    dark: '#059669',     // Green 600
    light: '#34d399',    // Green 400
    bg: '#d1fae5',       // Green 100
  },
  
  warning: {
    DEFAULT: '#f59e0b',  // Amber 500
    dark: '#d97706',     // Amber 600
    light: '#fbbf24',    // Amber 400
    bg: '#fef3c7',       // Amber 100
  },
  
  error: {
    DEFAULT: '#ef4444',  // Red 500
    dark: '#dc2626',     // Red 600
    light: '#f87171',    // Red 400
    bg: '#fee2e2',       // Red 100
  },
  
  info: {
    DEFAULT: '#3b82f6',  // Blue 500
    dark: '#2563eb',     // Blue 600
    light: '#60a5fa',    // Blue 400
    bg: '#dbeafe',       // Blue 100
  },

  // Task Priority Colors
  priority: {
    high: {
      text: '#ef4444',   // Red 500
      bg: '#fee2e2',     // Red 100
      border: '#fecaca', // Red 200
    },
    medium: {
      text: '#f59e0b',   // Amber 500
      bg: '#fef3c7',     // Amber 100
      border: '#fde68a', // Amber 200
    },
    low: {
      text: '#10b981',   // Green 500
      bg: '#d1fae5',     // Green 100
      border: '#a7f3d0', // Green 200
    },
  },

  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

/**
 * Tailwind CSS class names for common use cases
 */
export const classNames = {
  // Buttons
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors',
    success: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    danger: 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors',
  },

  // Cards
  card: {
    base: 'bg-white rounded-lg shadow-md p-6',
    hover: 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow',
    bordered: 'bg-white rounded-lg border border-gray-200 p-6',
  },

  // Inputs
  input: {
    base: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
    error: 'w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500',
  },

  // Badges
  badge: {
    primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
  },

  // Priority badges
  priority: {
    high: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600',
    medium: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600',
    low: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600',
  },

  // Status
  status: {
    completed: 'text-green-600 font-medium',
    pending: 'text-orange-600 font-medium',
    overdue: 'text-red-600 font-medium',
  },
};

/**
 * Helper function to get priority color
 */
export function getPriorityColor(priority: 'low' | 'medium' | 'high') {
  return colors.priority[priority];
}

/**
 * Helper function to get priority class names
 */
export function getPriorityClassName(priority: 'low' | 'medium' | 'high') {
  return classNames.priority[priority];
}
