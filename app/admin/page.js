'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [codes, setCodes] = useState([])
  const [tab, setTab] = useState('items')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile?.is_admin) router.replace('/')
      else {
        fetchItems()
        fetchUsers()
        fetchCodes()
      }
    }
  }, [authLoading, user, profile])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('items')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function fetchCodes() {
    const { data } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
    setCodes(data || [])
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleAdmin(userId, current) {
    if (!confirm(`${current ? 'Remove' : 'Grant'} admin for this user?`)) return
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
  }

  async function setApproval(userId, approved) {
    await supabase.from('profiles').update({ approved }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved } : u))
  }

  async function generateCode() {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({ code })
      .select()
      .single()
    if (!error && data) setCodes(prev => [data, ...prev])
  }

  const filteredItems = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.profiles?.username?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: items.length,
    public: items.filter(i => !i.is_private).length,
    wishlist: items.filter(i => i.status === 'wishlist').length,
    bought: items.filter(i => i.status === 'bought').length,
  }

  const pendingUsers = users.filter(u => !u.approved && !u.is_admin)

  if (authLoading) return null

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total items', value: stats.total },
            { label: 'Public', value: stats.public },
            { label: 'Wishlist', value: stats.wishlist },
            { label: 'Bought', value: stats.bought },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'items', label: 'items', count: items.length },
            { key: 'users', label: 'users', count: users.length, badge: pendingUsers.length },
            { key: 'codes', label: 'invite codes', count: codes.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors flex items-center gap-1.5 ${
                tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label} ({t.count})
              {t.badge > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${tab === t.key ? 'bg-white text-gray-900' : 'bg-amber-100 text-amber-700'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Items tab */}
        {tab === 'items' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-sm border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Item</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Visibility</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="w-8 h-8 object-contain rounded-lg bg-gray-50" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/${item.profiles?.username}`} className="text-blue-500 hover:underline">
                            @{item.profiles?.username}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {item.custom_status || item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.price ? `$${Number(item.price).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_private ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>
                            {item.is_private ? 'Private' : 'Public'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-3 justify-end">
                            <Link href={`/add?id=${item.id}`} className="text-blue-500 hover:text-blue-700 text-xs">
                              Edit
                            </Link>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-400">No items found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                              {u.username[0].toUpperCase()}
                            </div>
                          )}
                          <Link href={`/${u.username}`} className="font-medium text-gray-900 hover:underline">
                            @{u.username}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {u.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : u.approved ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">Approved</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== user?.id && (
                          <div className="flex gap-3 justify-end">
                            {!u.is_admin && (
                              u.approved ? (
                                <button
                                  onClick={() => setApproval(u.id, false)}
                                  className="text-xs text-red-400 hover:text-red-600"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => setApproval(u.id, true)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  Approve
                                </button>
                              )
                            )}
                            <button
                              onClick={() => toggleAdmin(u.id, u.is_admin)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              {u.is_admin ? 'Remove admin' : 'Make admin'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite codes tab */}
        {tab === 'codes' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {codes.filter(c => !c.used).length} unused · {codes.filter(c => c.used).length} used
              </p>
              <button
                onClick={generateCode}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
              >
                Generate code
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Used by</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => {
                    const usedByUser = users.find(u => u.id === c.used_by)
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <code className="font-mono text-sm tracking-widest text-gray-800">{c.code}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.used ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>
                            {c.used ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {usedByUser ? (
                            <Link href={`/${usedByUser.username}`} className="text-blue-500 hover:underline">
                              @{usedByUser.username}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {codes.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-400">No invite codes yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
