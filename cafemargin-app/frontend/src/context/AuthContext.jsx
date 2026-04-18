'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import i18n from '../i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('cafemargin_user')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem('cafemargin_user')
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (user?.preferred_lang) {
      i18n.changeLanguage(user.preferred_lang)
      localStorage.setItem('cafemargin_lang', user.preferred_lang)
    }
  }, [user?.preferred_lang])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const res = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const { access_token, user: userData } = res.data
      localStorage.setItem('cafemargin_token', access_token)
      localStorage.setItem('cafemargin_user', JSON.stringify(userData))
      setUser(userData)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: formatApiError(err, 'Login gagal') }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cafemargin_token')
    localStorage.removeItem('cafemargin_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const updated = { ...user, ...res.data }
      localStorage.setItem('cafemargin_user', JSON.stringify(updated))
      setUser(updated)
      return true
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('cafemargin_token')
        localStorage.removeItem('cafemargin_user')
        setUser(null)
      }
      console.warn('Gagal refresh user', err)
      return false
    }
  }, [user])

  const toggleLanguage = useCallback(async () => {
    const newLang = user?.preferred_lang === 'id' ? 'en' : 'id'
    i18n.changeLanguage(newLang)
    localStorage.setItem('cafemargin_lang', newLang)
    if (user) {
      await api.put('/auth/lang', { lang: newLang })
      const updated = { ...user, preferred_lang: newLang }
      localStorage.setItem('cafemargin_user', JSON.stringify(updated))
      setUser(updated)
    }
  }, [user])

  const hasLevel = useCallback((required) => {
    if (user?.role === 'superadmin') return true
    return (user?.subscription_level || 1) >= required
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    hydrated,
    login,
    logout,
    refreshUser,
    toggleLanguage,
    hasLevel,
  }), [user, loading, hydrated, login, logout, refreshUser, toggleLanguage, hasLevel])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
