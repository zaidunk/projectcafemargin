
'use client'

import { useEffect } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { Toaster } from 'react-hot-toast'
import i18n from '../i18n'
import { initAnalytics } from '../lib/firebase'

export default function Providers({ children }) {
  useEffect(() => {
    void initAnalytics()
    const stored = localStorage.getItem('cafemargin_lang')
    const nextLang = stored || 'id'
    if (nextLang !== i18n.language) {
      i18n.changeLanguage(nextLang)
    }
    document.documentElement.lang = nextLang
  }, [])

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#5c3d2e',
            color: '#f5efe6',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#c8a882', secondary: '#5c3d2e' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}
