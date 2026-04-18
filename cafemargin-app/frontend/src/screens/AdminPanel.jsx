import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import toast from 'react-hot-toast'
import { Plus, Trash2, Building2, Users } from 'lucide-react'
import clsx from 'clsx'

const LEVEL_COLORS = { 1: 'bg-amber-100 text-amber-800', 2: 'bg-green-100 text-green-800', 3: 'bg-blue-100 text-blue-800', 4: 'bg-purple-100 text-purple-800' }
const LEVEL_NAMES = { 1: 'DIAGNOSTIC', 2: 'GROWTH', 3: 'CONTROL', 4: 'SCALE' }

export default function AdminPanel() {
  const { user } = useAuth()
  const router = useRouter()
  const [cafes, setCafes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('cafes')
  const [showAddCafe, setShowAddCafe] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newCafe, setNewCafe] = useState({ name: '', owner_name: '', address: '', phone: '', subscription_level: 1 })
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'cafe_owner', cafe_id: '' })

  const fetchData = () => {
    setLoading(true)
    Promise.all([api.get('/admin/cafes'), api.get('/admin/users')]).then(([cafesRes, usersRes]) => {
      setCafes(cafesRes.data)
      setUsers(usersRes.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'superadmin') fetchData()
  }, [user])

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace('/dashboard')
    }
  }, [user, router])

  if (!user || user.role !== 'superadmin') return null

  async function addCafe(e) {
    e.preventDefault()
    await api.post('/admin/cafes', { ...newCafe, subscription_level: parseInt(newCafe.subscription_level) })
    toast.success('Cafe berhasil ditambahkan')
    setShowAddCafe(false)
    setNewCafe({ name: '', owner_name: '', address: '', phone: '', subscription_level: 1 })
    fetchData()
  }

  async function addUser(e) {
    e.preventDefault()
    try {
      await api.post('/admin/users', { ...newUser, cafe_id: newUser.cafe_id ? parseInt(newUser.cafe_id) : null })
      toast.success('User berhasil ditambahkan')
      setShowAddUser(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'cafe_owner', cafe_id: '' })
      fetchData()
    } catch (err) {
      toast.error(formatApiError(err, 'Gagal menambahkan user'))
    }
  }

  async function deleteUser(id) {
    if (!confirm('Yakin ingin menghapus user ini?')) return
    await api.delete(`/admin/users/${id}`)
    toast.success('User dihapus')
    setUsers(users.filter(u => u.id !== id))
  }

  return (
    <AppLayout title="Admin Panel">
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-brand-200 rounded-lg p-1 w-fit">
          {[{ key: 'cafes', label: 'Cafes', icon: Building2 }, { key: 'users', label: 'Users', icon: Users }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                tab === key ? 'bg-brand-700 text-white' : 'text-brand-600 hover:bg-brand-50')}>
              <Icon size={15} />{label}
              <span className={clsx('text-xs px-1.5 py-0.5 rounded-full ml-1', tab === key ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600')}>
                {key === 'cafes' ? cafes.length : users.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" /></div>
        ) : tab === 'cafes' ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-800">Daftar Cafe ({cafes.length})</h3>
              <button onClick={() => setShowAddCafe(!showAddCafe)} className="btn-primary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Tambah Cafe
              </button>
            </div>

            {showAddCafe && (
              <form onSubmit={addCafe} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Nama Cafe</label><input className="input" value={newCafe.name} onChange={(e) => setNewCafe({ ...newCafe, name: e.target.value })} required /></div>
                <div><label className="label">Nama Owner</label><input className="input" value={newCafe.owner_name} onChange={(e) => setNewCafe({ ...newCafe, owner_name: e.target.value })} required /></div>
                <div><label className="label">Alamat</label><input className="input" value={newCafe.address} onChange={(e) => setNewCafe({ ...newCafe, address: e.target.value })} /></div>
                <div><label className="label">Telepon</label><input className="input" value={newCafe.phone} onChange={(e) => setNewCafe({ ...newCafe, phone: e.target.value })} /></div>
                <div>
                  <label className="label">Level Langganan</label>
                  <select className="input" value={newCafe.subscription_level} onChange={(e) => setNewCafe({ ...newCafe, subscription_level: e.target.value })}>
                    {[1, 2, 3, 4].map(l => <option key={l} value={l}>Level {l} — {LEVEL_NAMES[l]}</option>)}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary text-sm">Tambah</button>
                  <button type="button" onClick={() => setShowAddCafe(false)} className="btn-outline text-sm">Batal</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {cafes.map((cafe) => (
                <div key={cafe.id} className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-xl">
                  <div className="w-10 h-10 bg-brand-200 rounded-lg flex items-center justify-center text-brand-700 font-bold">
                    {cafe.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-800 truncate">{cafe.name}</p>
                    <p className="text-xs text-brand-500">{cafe.owner_name} · {cafe.phone}</p>
                  </div>
                  <span className={clsx('badge-level', LEVEL_COLORS[cafe.subscription_level])}>
                    {LEVEL_NAMES[cafe.subscription_level]}
                  </span>
                  <span className="text-xs text-brand-400">{cafe.user_count} users</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-800">Daftar User ({users.length})</h3>
              <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Tambah User
              </button>
            </div>

            {showAddUser && (
              <form onSubmit={addUser} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Nama Lengkap</label><input className="input" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required /></div>
                <div><label className="label">Username / Email</label><input type="email" className="input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                <div><label className="label">Password</label><input type="password" className="input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    {['superadmin', 'cafe_owner', 'cafe_staff'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cafe</label>
                  <select className="input" value={newUser.cafe_id} onChange={(e) => setNewUser({ ...newUser, cafe_id: e.target.value })}>
                    <option value="">-- Tidak ada --</option>
                    {cafes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary text-sm">Tambah</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="btn-outline text-sm">Batal</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-xl">
                  <div className="w-9 h-9 bg-brand-300 rounded-full flex items-center justify-center text-brand-800 font-bold text-sm">
                    {u.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-800">{u.full_name}</p>
                    <p className="text-xs text-brand-500">{u.email}</p>
                  </div>
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{u.role}</span>
                  {u.cafe_id && (
                    <span className="text-xs text-brand-400">
                      {cafes.find(c => c.id === u.cafe_id)?.name}
                    </span>
                  )}
                  <button onClick={() => deleteUser(u.id)} className="text-brand-300 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
