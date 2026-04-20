'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PostLoginPopup from '../PostLoginPopup'

export default function AppLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleClose = useCallback(() => setMobileOpen(false), [])
  const handleOpen = useCallback(() => setMobileOpen(true), [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-brand-50">
      <PostLoginPopup />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleClose} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onToggleSidebar={handleOpen} />
        <main className="flex-1 overflow-auto p-[var(--pad-page)]">
          {children}
        </main>
      </div>
    </div>
  )
}
