'use client'

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleUsernameClick() {
    if (profile?.is_admin) {
      setDropdownOpen(v => !v)
    } else {
      router.push('/settings')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <Link href="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '0.08em' }}>
          NEEDLIST
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

                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={handleUsernameClick}
                    className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    {profile.username}
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                      style={{ fontSize: 14, padding: 8, minWidth: 140 }}
                    >
                      <Link
                        href="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Admin
                      </Link>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-gray-600 hidden sm:block"
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
