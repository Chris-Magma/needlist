'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function PendingGate({ children }) {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return children
  if (!user || !profile) return children
  if (profile.is_admin || profile.approved) return children

  if (profile.rejected) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access declined</h1>
          <p className="text-sm text-gray-400">
            Your access request has been declined.
          </p>
        </div>
      </div>
    )
  }

  // Authenticated but hasn't submitted an invite code yet (e.g. signed up via Google
  // without going through the signup flow, or invite code consumption failed)
  if (!profile.invite_code_used) {
    async function submitCode(e) {
      e.preventDefault()
      setError('')
      setSubmitting(true)
      const { data: ok } = await supabase.rpc('consume_invite_code', {
        p_code: code.trim().toUpperCase(),
        p_user_id: user.id,
      })
      if (ok) {
        await refreshProfile()
      } else {
        setError('Invalid or already used invite code.')
      }
      setSubmitting(false)
    }

    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Enter invite code</h1>
          <p className="text-sm text-gray-400 mb-6">You need a valid invite code to join Needlist.</p>
          <form onSubmit={submitCode} className="flex flex-col gap-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="XXXXXXXX"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Has invite code but pending admin approval
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F2F2F2] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Pending approval</h1>
        <p className="text-sm text-gray-400">
          Your account is pending approval. You'll get access once an admin approves you.
        </p>
      </div>
    </div>
  )
}
