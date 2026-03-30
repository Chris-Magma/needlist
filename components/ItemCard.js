'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { formatPrice } from '@/lib/utils'
import { convertPrice } from '@/lib/fx'

function ImagePlaceholder() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function MI({ name, size = 18 }) {
  return <span className="material-icons-outlined" style={{ fontSize: size }}>{name}</span>
}

export default function ItemCard({ item, showUser = false, onDelete, canEdit, batchMode = false, selected = false, onSelect }) {
  const { profile } = useAuth()
  const userCurrency = profile?.currency ?? 'EUR'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [displayPrice, setDisplayPrice] = useState(null)

  useEffect(() => {
    if (item.price == null) return
    const itemCurrency = item.price_currency ?? 'EUR'
    if (itemCurrency === userCurrency) {
      setDisplayPrice(formatPrice(item.price, userCurrency))
      return
    }
    convertPrice(item.price, itemCurrency, userCurrency).then(converted => {
      setDisplayPrice(formatPrice(converted, userCurrency))
    })
  }, [item.price, item.price_currency, userCurrency])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div
      className="group relative bg-white flex flex-col rounded-xl overflow-hidden"
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: '354px', backgroundColor: '#fff' }}
      >
        {/* Batch select checkbox — top-left, only in batch mode for editable items */}
        {batchMode && canEdit && (
          <button
            onClick={e => { e.stopPropagation(); onSelect?.() }}
            className="absolute top-3 left-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={selected
              ? { backgroundColor: '#111', border: '2px solid #111' }
              : { backgroundColor: 'rgba(255,255,255,0.9)', border: '2px solid #ccc' }
            }
          >
            {selected && <span className="material-icons-sharp text-white" style={{ fontSize: 14, lineHeight: 1 }}>check</span>}
          </button>
        )}

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Edit/Delete — bottom-right, hover only, desktop only */}
        {canEdit && (
          <div className="absolute bottom-2 right-2 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={`/add?id=${item.id}`}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgb(245,245,245)', color: '#555' }}
              title="Edit"
            >
              <MI name="edit" />
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-red-500 cursor-pointer"
                style={{ backgroundColor: 'rgb(245,245,245)', color: '#555' }}
                title="Delete"
              >
                <MI name="delete" />
              </button>
            )}
          </div>
        )}

        {/* ⋮ menu — mobile only */}
        {canEdit && (
          <div ref={menuRef} className="absolute bottom-2 right-2 md:hidden">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgb(245,245,245)', color: '#555' }}
            >
              <MI name="more_vert" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-10 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 min-w-[110px]">
                <a
                  href={`/add?id=${item.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <MI name="edit" size={16} /> Edit
                </a>
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(item.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                  >
                    <MI name="delete" size={16} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* External link — always visible, top-right of card */}
      {item.product_url && (
        <button
          onClick={() => window.open(item.product_url, '_blank')}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: 'rgb(245,245,245)', color: '#737373' }}
          title="View product"
        >
          <span className="material-icons-sharp" style={{ fontSize: 18 }}>arrow_outward</span>
        </button>
      )}

      {/* Details */}
      <div className="flex flex-col gap-1" style={{ padding: '16px' }}>
        {/* Brand · Category */}
        <p className="text-sm truncate" style={{ color: 'rgb(115,115,115)' }}>
          {[item.brand, item.category].filter(Boolean).join(' · ') || '\u00A0'}
        </p>

        {/* Name + Price */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-normal truncate" style={{ color: 'rgb(20,20,20)' }}>
            {item.name}
          </span>
          {item.price != null && displayPrice && (
            <span className="text-sm font-normal whitespace-nowrap" style={{ color: 'rgb(20,20,20)' }}>
              {displayPrice}
            </span>
          )}
        </div>

        {showUser && item.profiles?.username && (
          <Link href={`/${item.profiles.username}`} className="text-xs" style={{ color: 'rgb(115,115,115)' }}>
            @{item.profiles.username}
          </Link>
        )}
      </div>
    </div>
  )
}
