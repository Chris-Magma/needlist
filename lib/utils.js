/**
 * Format a price amount for display.
 * EUR: narrow no-break space (U+202F) as thousands separator, € suffix → "1 299 €"
 * USD: standard US formatting with $ prefix → "$1,299"
 */
export function formatPrice(price, currency) {
  const amount = Math.round(Number(price))
  if (currency === 'USD') {
    return '$' + amount.toLocaleString('en-US')
  }
  // EUR: manually insert narrow no-break spaces every 3 digits from the right
  const str = String(amount)
  let result = ''
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) result += '\u202F'
    result += str[i]
  }
  return result + '\u202F€'
}
