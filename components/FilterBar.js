'use client'

export default function FilterBar({ categories = [], users = [], statuses = [], filters, setFilters }) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: cat }))}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filters.category === cat
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status filter */}
          {statuses.length > 1 && (
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
              ))}
            </select>
          )}

          {/* User filter */}
          {users.length > 2 && (
            <select
              value={filters.user}
              onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {users.map(u => (
                <option key={u} value={u}>{u === 'All' ? 'All users' : `@${u}`}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
    </div>
  )
}
