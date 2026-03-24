'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ItemCard from '@/components/ItemCard'
import FilterBar from '@/components/FilterBar'

export default function HomePage() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: 'All', sort: 'newest' })

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

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <FilterBar
        categories={categories}
        filters={filters}
        setFilters={setFilters}
      />
      <main className="max-w-[1400px] mx-auto px-4 py-8">
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
                canEdit={user && (profile?.is_admin || item.user_id === user.id)}
                onDelete={user && (profile?.is_admin || item.user_id === user.id) ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
