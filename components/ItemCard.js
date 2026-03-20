'use client'

import Link from 'next/link'

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function ImagePlaceholder() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

const STATUS_STYLES = {
  wishlist: 'bg-blue-50 text-blue-500',
  bought: 'bg-green-50 text-green-600',
  archived: 'bg-gray-100 text-gray-400',
}

export default function ItemCard({ item, showUser = false, onDelete, canEdit }) {
  const displayStatus = item.custom_status || item.status
  const statusStyle = STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="relative bg-white aspect-square flex items-center justify-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain p-6"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <ImagePlaceholder />
        )}
        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 bg-white rounded-xl shadow-sm hover:shadow-md text-gray-400 hover:text-gray-700 transition-all"
            title="View product"
          >
            <ExternalLinkIcon />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-3 flex flex-col gap-1 flex-1">
        {/* Brand · Category */}
        <p className="text-xs text-gray-400 truncate">
          {[item.brand, item.category].filter(Boolean).join(' · ') || '\u00A0'}
        </p>

        {/* Name + Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
            {item.name}
          </h3>
          {item.price != null && (
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              ${Number(item.price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Status + User */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>
            {displayStatus}
          </span>
          {showUser && item.profiles?.username && (
            <Link
              href={`/${item.profiles.username}`}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              @{item.profiles.username}
            </Link>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
            <a
              href={`/add?id=${item.id}`}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Edit
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
