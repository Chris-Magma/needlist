export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    new URL(url) // validate
  } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 })
  }

  const isAmazon = /amazon\./i.test(new URL(url).hostname)

  try {
    if (isAmazon) {
      return Response.json(await fetchAmazon(url))
    } else {
      return Response.json(await fetchOg(url))
    }
  } catch {
    return Response.json({ error: 'Failed to fetch page' }, { status: 502 })
  }
}

async function fetchAmazon(url) {
  const apiKey = process.env.SCRAPER_API_KEY
  const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}`

  const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`ScraperAPI error: ${res.status}`)
  const html = await res.text()

  // Title: #productTitle
  const titleMatch = html.match(/id=["']productTitle["'][^>]*>\s*([\s\S]*?)\s*<\//)
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null

  // Price: .a-price-whole (first match)
  const priceMatch = html.match(/class=["'][^"']*a-price-whole[^"']*["'][^>]*>\s*([\d.,]+)/)
  let price = null
  if (priceMatch) {
    const parsed = parseFloat(priceMatch[1].replace(/[^\d.]/g, ''))
    if (!isNaN(parsed) && parsed > 0) price = parsed
  }

  // Image: #landingImage — prefer data-old-hires, fall back to src
  const imgMatch =
    html.match(/id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/) ||
    html.match(/id=["']landingImage["'][^>]+src=["']([^"']+)["']/) ||
    html.match(/data-old-hires=["']([^"']+)["'][^>]+id=["']landingImage["']/) ||
    html.match(/src=["']([^"']+)["'][^>]+id=["']landingImage["']/)
  const image = imgMatch ? imgMatch[1] : null

  return { title, image, price, description: null, ogType: null, keywords: null }
}

async function fetchOg(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NeedlistBot/1.0)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`Fetch error: ${res.status}`)
  const html = await res.text()

  function getMeta(property) {
    const match =
      html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
    return match ? match[1].trim() : null
  }

  function getMetaName(name) {
    const match =
      html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
    return match ? match[1].trim() : null
  }

  const title = getMeta('og:title') || getMetaName('twitter:title') || null
  const image = getMeta('og:image') || getMetaName('twitter:image') || null
  const description = getMeta('og:description') || getMetaName('twitter:description') || null
  const ogType = getMeta('og:type') || null
  const keywords = getMetaName('keywords') || null

  // Price: 1. meta tags
  let price = null
  const rawPrice = getMeta('og:price:amount') || getMeta('product:price:amount')
  if (rawPrice) {
    const parsed = parseFloat(rawPrice.replace(/[^\d.]/g, ''))
    if (!isNaN(parsed)) price = parsed
  }

  // Price: 2. JSON-LD
  if (price === null) {
    const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    for (const match of jsonLdMatches) {
      try {
        const json = JSON.parse(match[1])
        const candidates = Array.isArray(json) ? json : [json]
        for (const obj of candidates) {
          const offers = obj.offers ?? (obj['@type'] === 'Offer' ? obj : null)
          const offerList = Array.isArray(offers) ? offers : offers ? [offers] : []
          for (const offer of offerList) {
            const p = parseFloat(String(offer.price ?? '').replace(/[^\d.]/g, ''))
            if (!isNaN(p) && p > 0) { price = p; break }
          }
          if (price !== null) break
          if (obj.price !== undefined) {
            const p = parseFloat(String(obj.price).replace(/[^\d.]/g, ''))
            if (!isNaN(p) && p > 0) { price = p; break }
          }
        }
      } catch { /* malformed JSON-LD, skip */ }
      if (price !== null) break
    }
  }

  return { title, image, description, ogType, keywords, price }
}
