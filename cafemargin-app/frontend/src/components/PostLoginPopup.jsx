'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function PostLoginPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('cafemargin_poster_shown')) {
      setVisible(true)
    }
  }, [])

  function close() {
    sessionStorage.setItem('cafemargin_poster_shown', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={close}
    >
      <div
        className="relative max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-700 hover:bg-brand-50 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src="/poster.png"
          alt="CafeMargin"
          className="w-full rounded-2xl shadow-2xl cursor-pointer"
          onClick={close}
        />
      </div>
    </div>
  )
}
