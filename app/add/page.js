'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Suspense } from 'react'

const PREDEFINED_STATUSES = ['wishlist', 'bought', 'archived']

function brandFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const parts = host.split('.')
    const name = parts.length > 2 ? parts[parts.length - 2] : parts[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return null
  }
}

function categoryFromOg(ogType, keywords) {
  if (ogType && !['website', 'article', 'blog', 'object'].includes(ogType.toLowerCase())) {
    return ogType.replace(/[._-]/g, ' ').trim()
  }
  if (keywords) {
    const first = keywords.split(',')[0].trim()
    if (first) return first
  }
  return null
}

function MI({ name, size = 18 }) {
  return <span className="material-icons-outlined" style={{ fontSize: size }}>{name}</span>
}

function AddItemForm() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    price_currency: 'EUR',
    image_url: '',
    product_url: '',
    status: 'wishlist',
    custom_status: '',
    tags: '',
    is_private: false,
  })

  // Sync price_currency default from profile once loaded
  useEffect(() => {
    if (profile?.currency && !editId) {
      set('price_currency', profile.currency)
    }
  }, [profile?.currency])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ogLoading, setOgLoading] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [ogImages, setOgImages] = useState([])
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (editId) loadItem(editId)
  }, [editId])

  async function loadItem(id) {
    const { data } = await supabase.from('items').select('*').eq('id', id).single()
    if (data) {
      setForm({
        name: data.name || '',
        brand: data.brand || '',
        category: data.category || '',
        price: data.price?.toString() || '',
        price_currency: data.price_currency || 'EUR',
        image_url: data.image_url || '',
        product_url: data.product_url || '',
        status: data.status || 'wishlist',
        custom_status: data.custom_status || '',
        tags: (data.tags || []).join(', '),
        is_private: data.is_private || false,
      })
      // Expand more options if any are filled
      if (data.tags?.length || data.custom_status || data.is_private) setShowMore(true)
    }
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function fetchOgData(url) {
    if (!url) return
    try { new URL(url) } catch { return }

    setOgLoading(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      const data = await res.json()

      const inferredBrand = brandFromUrl(url)
      const inferredCategory = categoryFromOg(data.ogType, data.keywords)

      const images = data.images?.length ? data.images : (data.image ? [data.image] : [])
      setOgImages(images)
      setCarouselIndex(0)

      setForm(f => ({
        ...f,
        name: f.name || data.title || f.name,
        image_url: f.image_url || images[0] || f.image_url,
        brand: f.brand || inferredBrand || f.brand,
        category: f.category || inferredCategory || f.category,
        price: f.price || (data.price != null ? String(data.price) : f.price),
      }))
    } catch {
      // silently fail — user can fill manually
    } finally {
      setOgLoading(false)
    }
  }

  function selectCarouselImage(index) {
    setCarouselIndex(index)
    set('image_url', ogImages[index])
  }

  function carouselPrev() {
    const next = (carouselIndex - 1 + ogImages.length) % ogImages.length
    selectCarouselImage(next)
  }

  function carouselNext() {
    const next = (carouselIndex + 1) % ogImages.length
    selectCarouselImage(next)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      price_currency: form.price_currency,
      image_url: form.image_url.trim() || null,
      product_url: form.product_url.trim() || null,
      status: form.status,
      custom_status: form.custom_status.trim() || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_private: form.is_private,
    }

    let err
    if (editId) {
      const { error } = await supabase.from('items').update(payload).eq('id', editId)
      err = error
    } else {
      const { error } = await supabase.from('items').insert({ ...payload, user_id: user.id })
      err = error
    }

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Image preview — full width, top of card */}
        {form.image_url && (
          <img
            src={form.image_url}
            alt="Product preview"
            className="w-full h-[200px] object-cover"
            onError={e => e.target.style.display = 'none'}
          />
        )}

        {/* Image carousel — shown when multiple images returned from OG fetch */}
        {ogImages.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={carouselPrev}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <MI name="chevron_left" />
            </button>
            <div className="flex gap-2 overflow-x-auto flex-1 py-1">
              {ogImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectCarouselImage(i)}
                  className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors"
                  style={{ borderColor: i === carouselIndex ? '#111' : '#e5e7eb' }}
                >
                  <img
                    src={src}
                    alt={`Option ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.parentElement.style.display = 'none' }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={carouselNext}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <MI name="chevron_right" />
            </button>
          </div>
        )}

        <div className="p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {editId ? 'Edit item' : 'Add to Needlist'}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Product URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Product URL
                {ogLoading && <span className="ml-2 text-gray-400 font-normal">Fetching info...</span>}
              </label>
              <input
                type="url"
                value={form.product_url}
                onChange={e => set('product_url', e.target.value)}
                onBlur={e => fetchOgData(e.target.value)}
                onPaste={e => {
                  const pasted = e.clipboardData.getData('text')
                  fetchOgData(pasted)
                }}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* Image URL (hidden field — auto-filled, editable) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* Product name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                placeholder="e.g. AirPods Pro"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* Brand + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="e.g. Apple"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="e.g. Audio"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0.00"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <select
                  value={form.price_currency}
                  onChange={e => set('price_currency', e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* More options toggle */}
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="text-sm text-gray-400 hover:text-gray-600 text-left"
            >
              {showMore ? '− Less options' : '+ More options'}
            </button>

            {/* Collapsible section */}
            {showMore && (
              <div className="flex flex-col gap-4">
                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={e => set('status', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      {PREDEFINED_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Custom status</label>
                    <input
                      type="text"
                      value={form.custom_status}
                      onChange={e => set('custom_status', e.target.value)}
                      placeholder="e.g. Considering..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                    placeholder="e.g. tech, gift, summer"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                {/* Private toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.is_private}
                      onChange={e => set('is_private', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm text-gray-600">Private (only visible to you)</span>
                </label>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editId ? 'Save changes' : 'Add to list'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddPage() {
  return (
    <Suspense>
      <AddItemForm />
    </Suspense>
  )
}
