// Currency conversion utilities for bounty display
// Real-time BTC price from CoinGecko API
// USDC and USDT are 1:1 with USD

export type DisplayCurrency = 'USD' | 'USDC' | 'USDT' | 'BTC'

const SATS_PER_BTC = 100_000_000
const CACHE_DURATION_MS = 60_000 // Cache price for 1 minute

// LocalStorage key for persisting currency preference
const CURRENCY_STORAGE_KEY = 'clawdentials_display_currency'
const PRICE_CACHE_KEY = 'clawdentials_btc_price_cache'

// Cached BTC price
interface PriceCache {
  btcPriceUsd: number
  timestamp: number
}

let priceCache: PriceCache | null = null

// Default fallback price if API fails (~$97k)
const FALLBACK_BTC_PRICE = 97000

// Load price cache from localStorage on init
function loadPriceCache(): PriceCache | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(PRICE_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as PriceCache
      // Check if still valid
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

// Save price cache to localStorage
function savePriceCache(cache: PriceCache): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

// Fetch BTC price from CoinGecko (free, no API key required)
export async function fetchBtcPrice(): Promise<number> {
  // Check memory cache first
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION_MS) {
    return priceCache.btcPriceUsd
  }

  // Check localStorage cache
  const storedCache = loadPriceCache()
  if (storedCache) {
    priceCache = storedCache
    return storedCache.btcPriceUsd
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const btcPrice = data?.bitcoin?.usd

    if (typeof btcPrice === 'number' && btcPrice > 0) {
      const newCache: PriceCache = {
        btcPriceUsd: btcPrice,
        timestamp: Date.now(),
      }
      priceCache = newCache
      savePriceCache(newCache)
      return btcPrice
    }

    throw new Error('Invalid price data')
  } catch (error) {
    console.warn('Failed to fetch BTC price, using fallback:', error)
    // Return cached price if available, otherwise fallback
    return priceCache?.btcPriceUsd ?? FALLBACK_BTC_PRICE
  }
}

// Get current BTC price (sync, uses cache)
export function getBtcPrice(): number {
  if (priceCache) {
    return priceCache.btcPriceUsd
  }
  const storedCache = loadPriceCache()
  if (storedCache) {
    priceCache = storedCache
    return storedCache.btcPriceUsd
  }
  return FALLBACK_BTC_PRICE
}

// Calculate sats per USD based on current BTC price
export function getSatsPerUsd(): number {
  const btcPrice = getBtcPrice()
  return Math.round(SATS_PER_BTC / btcPrice)
}

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
export function convertFromUSD(amount: number, toCurrency: DisplayCurrency, btcPriceUsd?: number): number {
  switch (toCurrency) {
    case 'USD':
    case 'USDC':
    case 'USDT':
      return amount
    case 'BTC': {
      // Return in satoshis
      const price = btcPriceUsd ?? getBtcPrice()
      const satsPerUsd = Math.round(SATS_PER_BTC / price)
      return Math.round(amount * satsPerUsd)
    }
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
export function convertAndFormat(usdAmount: number, displayCurrency: DisplayCurrency, btcPriceUsd?: number): string {
  const converted = convertFromUSD(usdAmount, displayCurrency, btcPriceUsd)
  return formatCurrency(converted, displayCurrency)
}

// Get all three currency representations for detail view
export function getAllCurrencyFormats(usdAmount: number, btcPriceUsd?: number): {
  usd: string
  usdc: string
  usdt: string
  btc: string
  sats: number
  btcPrice: number
} {
  const price = btcPriceUsd ?? getBtcPrice()
  const satsPerUsd = Math.round(SATS_PER_BTC / price)
  const sats = Math.round(usdAmount * satsPerUsd)

  return {
    usd: `$${usdAmount.toLocaleString()}`,
    usdc: `${usdAmount.toLocaleString()} USDC`,
    usdt: `${usdAmount.toLocaleString()} USDT`,
    btc: sats >= SATS_PER_BTC
      ? `${(sats / SATS_PER_BTC).toFixed(6)} BTC`
      : `${sats.toLocaleString()} sats`,
    sats,
    btcPrice: price,
  }
}

// Format BTC price for display
export function formatBtcPrice(price: number): string {
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
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
  BTC: { symbol: '₿', name: 'BTC' },
}
