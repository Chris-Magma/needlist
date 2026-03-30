'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function ArrowUpRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ImagePlaceholder() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export default function ItemCard({ item, showUser = false, onDelete, canEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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
              <EditIcon />
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-red-500"
                style={{ backgroundColor: 'rgb(245,245,245)', color: '#555' }}
                title="Delete"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}

        {/* ⋮ menu — mobile only */}
        {canEdit && (
          <div ref={menuRef} className="absolute bottom-2 right-2 md:hidden">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-base leading-none"
              style={{ backgroundColor: 'rgb(245,245,245)', color: '#555' }}
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute bottom-10 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 min-w-[110px]">
                <a
                  href={`/add?id=${item.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <EditIcon /> Edit
                </a>
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(item.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                  >
                    <TrashIcon /> Delete
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
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgb(245,245,245)', color: '#737373' }}
          title="View product"
        >
          <ArrowUpRightIcon />
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
          {item.price != null && (
            <span className="text-sm font-normal whitespace-nowrap" style={{ color: 'rgb(20,20,20)' }}>
              ${Number(item.price).toFixed(2)}
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
