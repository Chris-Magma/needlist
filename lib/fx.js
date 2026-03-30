// Module-level cache — persists for the lifetime of the JS module (resets on page reload)
const TTL = 60 * 60 * 1000 // 1 hour
const cache = {}

/**
 * Returns the exchange rate to convert 1 unit of `from` into `to`.
 * Cached for 1 hour per currency pair.
 */
async function getRate(from, to) {
  if (from === to) return 1
  const key = `${from}_${to}`
  const now = Date.now()
  if (cache[key] && now - cache[key].timestamp < TTL) return cache[key].rate
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
    const data = await res.json()
    const rate = data.rates[to]
    cache[key] = { rate, timestamp: now }
    return rate
  } catch {
    return cache[key]?.rate ?? 1
  }
}

/**
 * Convert `amount` from currency `from` to currency `to`.
 */
export async function convertPrice(amount, from, to) {
  if (from === to) return amount
  const rate = await getRate(from, to)
  return amount * rate
}
