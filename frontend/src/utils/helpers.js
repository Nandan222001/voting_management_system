import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns'
import { DATE_FORMAT } from './constants'

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a date string or Date object using date-fns.
 * @param {string|Date} date - The date to format.
 * @param {string} [fmt] - The format pattern (defaults to 'MMM dd, yyyy').
 * @returns {string} Formatted date string or '—' if invalid.
 */
export function formatDate(date, fmt = DATE_FORMAT.DISPLAY) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return format(d, fmt)
  } catch {
    return '—'
  }
}

/**
 * Formats a date with time.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return formatDate(date, DATE_FORMAT.DISPLAY_TIME)
}

/**
 * Returns a relative time string like "3 hours ago".
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

// ─── Number Formatting ────────────────────────────────────────────────────────

/**
 * Formats a number with locale-aware thousands separators.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0'
  return Number(n).toLocaleString()
}

/**
 * Formats a number as a compact representation (e.g. 1.2K, 3.4M).
 * @param {number} n
 * @returns {string}
 */
export function formatCompact(n) {
  if (n === null || n === undefined || isNaN(n)) return '0'
  const num = Number(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}

// ─── Status Colors ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  active: 'text-green-700 bg-green-100',
  open: 'text-green-700 bg-green-100',
  approved: 'text-green-700 bg-green-100',
  pending: 'text-yellow-700 bg-yellow-100',
  'pending approval': 'text-yellow-700 bg-yellow-100',
  draft: 'text-gray-600 bg-gray-100',
  inactive: 'text-gray-600 bg-gray-100',
  blocked: 'text-red-700 bg-red-100',
  cancelled: 'text-red-700 bg-red-100',
  rejected: 'text-red-700 bg-red-100',
  closed: 'text-[rgb(16_102_177)] bg-[#e6edfb]',
  finished: 'text-[rgb(16_102_177)] bg-[#e6edfb]',
  completed: 'text-[rgb(16_102_177)] bg-[#e6edfb]',
  admin: 'text-[rgb(16_102_177)] bg-[#e6edfb]',
  moderator: 'text-[rgb(16_102_177)] bg-[#e6edfb]',
  voter: 'text-teal-700 bg-teal-100',
}

/**
 * Returns Tailwind color classes for a given status string.
 * @param {string} status
 * @returns {string} Tailwind class string
 */
export function getStatusColor(status) {
  if (!status) return 'text-gray-600 bg-gray-100'
  const key = String(status).toLowerCase().trim()
  return STATUS_COLORS[key] ?? 'text-gray-600 bg-gray-100'
}

// ─── Text Utilities ───────────────────────────────────────────────────────────

/**
 * Truncates text to a maximum length, appending '...' if truncated.
 * @param {string} text
 * @param {number} [len=50]
 * @returns {string}
 */
export function truncateText(text, len = 50) {
  if (!text) return ''
  const s = String(text)
  return s.length > len ? `${s.slice(0, len)}...` : s
}

/**
 * Capitalizes the first letter of each word.
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
  if (!str) return ''
  return String(str)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Returns initials from a full name (up to 2 characters).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ─── Math Utilities ───────────────────────────────────────────────────────────

/**
 * Calculates percentage of part out of total.
 * @param {number} part
 * @param {number} total
 * @param {number} [decimals=1]
 * @returns {number}
 */
export function calculatePercentage(part, total, decimals = 1) {
  if (!total || total === 0) return 0
  return parseFloat(((part / total) * 100).toFixed(decimals))
}

/**
 * Clamps a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// ─── ID Utilities ─────────────────────────────────────────────────────────────

/**
 * Extracts a consistent ID from an object that may use _id or id.
 * @param {object} obj
 * @returns {string|undefined}
 */
export function getId(obj) {
  return obj?._id || obj?.id
}
