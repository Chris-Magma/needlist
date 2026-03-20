'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const [currency, setCurrency] = useState('EUR')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (profile) setCurrency(profile.currency_preference || 'EUR')
  }, [profile])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({ currency_preference: currency })
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (authLoading || !profile) return null

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

        <div className="flex flex-col gap-6">
          {/* Currency preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Currency</label>
            <div className="flex gap-3">
              {[
                { value: 'EUR', label: '€ Euro' },
                { value: 'USD', label: '$ US Dollar' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCurrency(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    currency === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
