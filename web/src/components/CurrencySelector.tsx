import { useState, useRef, useEffect } from 'react'
import type { DisplayCurrency } from '../utils/currency'
import { currencyColors, currencyInfo } from '../utils/currency'

interface CurrencySelectorProps {
  value: DisplayCurrency
  onChange: (currency: DisplayCurrency) => void
}

const currencies: DisplayCurrency[] = ['USD', 'USDC', 'USDT', 'BTC']

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentColors = currencyColors[value]
  const currentInfo = currencyInfo[value]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: currentColors.bg,
          color: currentColors.text,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span>{currentInfo.symbol || currentInfo.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-32 rounded-lg py-1 z-50"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {currencies.map((currency) => {
            const colors = currencyColors[currency]
            const info = currencyInfo[currency]
            const isSelected = currency === value

            return (
              <button
                key={currency}
                onClick={() => {
                  onChange(currency)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-all hover:bg-opacity-80"
                style={{
                  background: isSelected ? colors.bg : 'transparent',
                  color: isSelected ? colors.text : 'var(--text-secondary)',
                }}
              >
                {info.symbol && <span className="w-4">{info.symbol}</span>}
                <span>{info.name}</span>
                {isSelected && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
