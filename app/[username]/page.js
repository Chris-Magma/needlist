'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ItemCard from '@/components/ItemCard'
import FilterBar from '@/components/FilterBar'

function applySort(items, sort) {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'oldest': return new Date(a.created_at) - new Date(b.created_at)
      case 'price-asc': return (a.price ?? Infinity) - (b.price ?? Infinity)
      case 'price-desc': return (b.price ?? -Infinity) - (a.price ?? -Infinity)
      case 'name': return a.name.localeCompare(b.name)
      default: return new Date(b.created_at) - new Date(a.created_at)
    }
  })
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user, profile: myProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    user: 'All',
    sort: 'newest',
  })

  const isOwner = myProfile?.username === username || myProfile?.is_admin

  useEffect(() => {
    fetchProfile()
  }, [username])

  async function fetchProfile() {
    setLoading(true)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (!profileData) {
      setLoading(false)
      return
    }
    setProfile(profileData)

    // Fetch items — if owner, fetch all; otherwise only public
    let query = supabase
      .from('items')
      .select('*, profiles(username, avatar_url)')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })

    if (!isOwner) query = query.eq('is_private', false)

    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const categories = useMemo(
    () => ['All', ...new Set(items.map(i => i.category).filter(Boolean))],
    [items]
  )
  const statuses = useMemo(
    () => ['All', 'wishlist', 'bought', 'archived', ...new Set(items.map(i => i.custom_status).filter(Boolean))],
    [items]
  )

  const filtered = useMemo(() => {
    let result = items
    if (filters.category !== 'All') result = result.filter(i => i.category === filters.category)
    if (filters.status !== 'All') result = result.filter(i => i.status === filters.status || i.custom_status === filters.status)
    return applySort(result, filters.sort)
  }, [items, filters])

  if (!loading && !profile) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] flex items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2]">
      {/* Profile header */}
      {profile && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-medium">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900">@{profile.username}</h1>
              <p className="text-sm text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
            {isOwner && (
              <a
                href="/add"
                className="ml-auto text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
              >
                + Add
              </a>
            )}
          </div>
        </div>
      )}

      <FilterBar
        categories={categories}
        statuses={statuses}
        users={['All']}
        filters={filters}
        setFilters={setFilters}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">Nothing here yet</p>
            {isOwner && (
              <a href="/add" className="text-sm text-gray-600 underline mt-2 inline-block">
                Add your first item
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                canEdit={isOwner}
                onDelete={isOwner ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
