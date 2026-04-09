import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'
import i18n from '../i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cafemargin_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.preferred_lang) {
      i18n.changeLanguage(user.preferred_lang)
      localStorage.setItem('cafemargin_lang', user.preferred_lang)
    }
  }, [user?.preferred_lang])

  async function login(email, password) {
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
      return { ok: false, error: err.response?.data?.detail || 'Login gagal' }
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('cafemargin_token')
    localStorage.removeItem('cafemargin_user')
    setUser(null)
  }

  async function refreshUser() {
    try {
      const res = await api.get('/auth/me')
      const updated = { ...user, ...res.data }
      localStorage.setItem('cafemargin_user', JSON.stringify(updated))
      setUser(updated)
    } catch {}
  }

  async function toggleLanguage() {
    const newLang = user?.preferred_lang === 'id' ? 'en' : 'id'
    i18n.changeLanguage(newLang)
    localStorage.setItem('cafemargin_lang', newLang)
    if (user) {
      await api.put('/auth/lang', { lang: newLang })
      const updated = { ...user, preferred_lang: newLang }
      localStorage.setItem('cafemargin_user', JSON.stringify(updated))
      setUser(updated)
    }
  }

  const hasLevel = (required) => {
    if (user?.role === 'superadmin') return true
    return (user?.subscription_level || 1) >= required
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, toggleLanguage, hasLevel }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
