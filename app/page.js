'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ItemCard from '@/components/ItemCard'

export default function HomePage() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return null

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">No items yet</p>
            <p className="text-sm mt-1">Be the first to add something to your Needlist</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
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
