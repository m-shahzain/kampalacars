import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `UGX ${new Intl.NumberFormat('en-UG', {
    maximumFractionDigits: 0,
  }).format(price)}`
}

// Short price label for tight spaces, e.g. 25000000 -> "25M", 1500000000 -> "1.5B".
export function formatCompactPrice(price: number): string {
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [size, suffix] of units) {
    if (price >= size) return `${parseFloat((price / size).toFixed(1))}${suffix}`
  }
  return String(price)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/** Shortens text to a whole word within the length, e.g. for meta descriptions. */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  const cut = text.lastIndexOf(' ', length - 1)
  return `${text.slice(0, cut > 0 ? cut : length - 1).replace(/[\s,.;:–-]+$/, '')}…`
}
