'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-gray-900 tracking-tight">
          Needlist
        </Link>

        {!loading && (
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                <Link
                  href="/add"
                  className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
                >
                  + Add
                </Link>
                <span className="text-sm text-gray-500">{profile.username}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
