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

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NeedlistBot/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch page' }, { status: 502 })
    }

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

    // Price extraction
    let price = null

    // 1. og:price:amount or product:price:amount meta tags
    const rawPrice = getMeta('og:price:amount') || getMeta('product:price:amount')
    if (rawPrice) {
      const parsed = parseFloat(rawPrice.replace(/[^\d.]/g, ''))
      if (!isNaN(parsed)) price = parsed
    }

    // 2. JSON-LD script tags
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
            // top-level price field
            if (obj.price !== undefined) {
              const p = parseFloat(String(obj.price).replace(/[^\d.]/g, ''))
              if (!isNaN(p) && p > 0) { price = p; break }
            }
          }
        } catch { /* malformed JSON-LD, skip */ }
        if (price !== null) break
      }
    }

    return Response.json({ title, image, description, ogType, keywords, price })
  } catch {
    return Response.json({ error: 'Failed to fetch page' }, { status: 502 })
  }
}
