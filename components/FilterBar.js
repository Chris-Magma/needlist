'use client'

const SORT_LABELS = {
  newest: 'Newest',
  oldest: 'Oldest',
  'price-asc': 'Price ↑',
  'price-desc': 'Price ↓',
  name: 'Name A–Z',
}

export default function FilterBar({ categories = [], users = [], statuses = [], filters, setFilters }) {
  return (
    <div className="bg-[#F2F2F2] border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: cat }))}
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors"
              style={
                filters.category === cat
                  ? { backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #1a1a1a' }
                  : { backgroundColor: '#fff', color: '#555', border: '1px solid #e5e5e5' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort — plain text + chevron, no border/bg */}
        <div className="flex items-center gap-2 shrink-0">
          {statuses.length > 1 && (
            <div className="relative">
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="text-sm pr-5 bg-transparent focus:outline-none appearance-none cursor-pointer"
                style={{ color: '#555' }}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          {users.length > 2 && (
            <div className="relative">
              <select
                value={filters.user}
                onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
                className="text-sm pr-5 bg-transparent focus:outline-none appearance-none cursor-pointer"
                style={{ color: '#555' }}
              >
                {users.map(u => (
                  <option key={u} value={u}>{u === 'All' ? 'All users' : `@${u}`}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          <div className="relative">
            <span className="text-sm pointer-events-none" style={{ color: '#555' }}>
              Sort: {SORT_LABELS[filters.sort]}
            </span>
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="name">Name A–Z</option>
            </select>
            <svg className="pointer-events-none inline-block ml-1" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
