'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ItemCard from '@/components/ItemCard'
import FilterBar from '@/components/FilterBar'

export default function HomePage() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: 'All', sort: 'newest' })

  // Batch mode
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const categoryInputRef = useRef(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('is_private', false)
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems(data ?? [])
      } catch (err) {
        console.error('fetchItems:', err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function canEdit(item) {
    return !!(user && (profile?.is_admin || item.user_id === user.id))
  }

  function exitBatch() {
    setBatchMode(false)
    setSelectedIds(new Set())
    setShowCategoryInput(false)
    setCategoryInput('')
  }

  function toggleBatch() {
    if (batchMode) { exitBatch(); return }
    setBatchMode(true)
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBatchDelete() {
    const count = selectedIds.size
    if (!confirm(`Delete ${count} item${count !== 1 ? 's' : ''}? This cannot be undone.`)) return
    const ids = [...selectedIds]
    await supabase.from('items').delete().in('id', ids)
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)))
    exitBatch()
  }

  async function handleBatchAssignCategory() {
    const cat = categoryInput.trim()
    if (!cat) return
    const ids = [...selectedIds]
    await supabase.from('items').update({ category: cat }).in('id', ids)
    setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, category: cat } : i))
    setShowCategoryInput(false)
    setCategoryInput('')
  }

  useEffect(() => {
    if (showCategoryInput) categoryInputRef.current?.focus()
  }, [showCategoryInput])

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))]
    return ['All', ...cats.sort()]
  }, [items])

  const displayedItems = useMemo(() => {
    let list = filters.category === 'All'
      ? items
      : items.filter(i => i.category === filters.category)

    switch (filters.sort) {
      case 'oldest':      list = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break
      case 'price-asc':   list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break
      case 'price-desc':  list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break
      case 'name':        list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break
      default:            break // newest — already ordered from DB
    }

    return list
  }, [items, filters])

  if (loading) return null

  const hasEditable = user && items.some(i => canEdit(i))

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <FilterBar
        categories={categories}
        filters={filters}
        setFilters={setFilters}
        batchMode={batchMode}
        onBatchToggle={hasEditable ? toggleBatch : undefined}
      />
      <main className="max-w-[1400px] mx-auto px-4 py-8" style={batchMode ? { paddingBottom: '96px' } : {}}>
        {displayedItems.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">No items yet</p>
            <p className="text-sm mt-1">Be the first to add something to your Needlist</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {displayedItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                canEdit={canEdit(item)}
                onDelete={canEdit(item) ? handleDelete : undefined}
                batchMode={batchMode}
                selected={selectedIds.has(item.id)}
                onSelect={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating batch action bar */}
      {batchMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-1 px-2 py-2" style={{ minWidth: 320 }}>
          <span className="text-sm text-gray-400 px-2 whitespace-nowrap" style={{ minWidth: 80 }}>
            {selectedIds.size} selected
          </span>

          <div className="w-px self-stretch bg-gray-100 mx-1" />

          {showCategoryInput ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                ref={categoryInputRef}
                type="text"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBatchAssignCategory()}
                placeholder="Category name"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-0"
              />
              <button
                onClick={handleBatchAssignCategory}
                disabled={!categoryInput.trim()}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white disabled:opacity-40 whitespace-nowrap"
              >
                Apply
              </button>
              <button
                onClick={() => { setShowCategoryInput(false); setCategoryInput('') }}
                className="text-sm px-2 py-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCategoryInput(true)}
              disabled={selectedIds.size === 0}
              className="text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap transition-colors"
            >
              Assign category
            </button>
          )}

          {!showCategoryInput && (
            <>
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 whitespace-nowrap transition-colors"
              >
                Delete
              </button>
              <div className="w-px self-stretch bg-gray-100 mx-1" />
              <button
                onClick={exitBatch}
                className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 whitespace-nowrap transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
