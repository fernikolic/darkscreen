// Currency conversion utilities for bounty display
// Conversion rates: USDC and USDT are 1:1 with USD
// BTC: 1 USD = 1030 sats (approximately $97k/BTC)

export type DisplayCurrency = 'USD' | 'USDC' | 'USDT' | 'BTC'

const SATS_PER_USD = 1030
const SATS_PER_BTC = 100_000_000

// LocalStorage key for persisting currency preference
const CURRENCY_STORAGE_KEY = 'clawdentials_display_currency'

export function getStoredCurrency(): DisplayCurrency {
  if (typeof window === 'undefined') return 'USD'
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY)
  if (stored && ['USD', 'USDC', 'USDT', 'BTC'].includes(stored)) {
    return stored as DisplayCurrency
  }
  return 'USD'
}

export function setStoredCurrency(currency: DisplayCurrency): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
}

// Convert USD amount to specified display currency
export function convertFromUSD(amount: number, toCurrency: DisplayCurrency): number {
  switch (toCurrency) {
    case 'USD':
    case 'USDC':
    case 'USDT':
      return amount
    case 'BTC':
      // Return in satoshis
      return Math.round(amount * SATS_PER_USD)
    default:
      return amount
  }
}

// Format amount for display with currency symbol/suffix
export function formatCurrency(amount: number, currency: DisplayCurrency): string {
  switch (currency) {
    case 'USD':
      return `$${amount.toLocaleString()}`
    case 'USDC':
      return `${amount.toLocaleString()} USDC`
    case 'USDT':
      return `${amount.toLocaleString()} USDT`
    case 'BTC':
      // amount is in sats
      if (amount >= SATS_PER_BTC) {
        const btc = amount / SATS_PER_BTC
        return `${btc.toFixed(4)} BTC`
      }
      return `${amount.toLocaleString()} sats`
    default:
      return `$${amount.toLocaleString()}`
  }
}

// Convert and format in one call
export function convertAndFormat(usdAmount: number, displayCurrency: DisplayCurrency): string {
  const converted = convertFromUSD(usdAmount, displayCurrency)
  return formatCurrency(converted, displayCurrency)
}

// Get all three currency representations for detail view
export function getAllCurrencyFormats(usdAmount: number): {
  usd: string
  usdc: string
  usdt: string
  btc: string
  sats: number
} {
  const sats = Math.round(usdAmount * SATS_PER_USD)
  return {
    usd: `$${usdAmount.toLocaleString()}`,
    usdc: `${usdAmount.toLocaleString()} USDC`,
    usdt: `${usdAmount.toLocaleString()} USDT`,
    btc: sats >= SATS_PER_BTC
      ? `${(sats / SATS_PER_BTC).toFixed(6)} BTC`
      : `${sats.toLocaleString()} sats`,
    sats,
  }
}

// Currency badge colors (matching existing design)
export const currencyColors: Record<DisplayCurrency, { bg: string; text: string }> = {
  USD: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
  USDC: { bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  USDT: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
  BTC: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
}

// Currency icons/symbols for dropdown
export const currencyInfo: Record<DisplayCurrency, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'USD' },
  USDC: { symbol: '', name: 'USDC' },
  USDT: { symbol: '', name: 'USDT' },
  BTC: { symbol: '', name: 'BTC' },
}
