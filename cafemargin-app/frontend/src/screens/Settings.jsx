import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/Layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil } from 'lucide-react'
import clsx from 'clsx'

const LEVEL_NAMES = { 1: 'DIAGNOSTIC', 2: 'GROWTH', 3: 'CONTROL', 4: 'SCALE' }
const LEVEL_COLORS = { 1: 'bg-amber-100 text-amber-800', 2: 'bg-green-100 text-green-800', 3: 'bg-blue-100 text-blue-800', 4: 'bg-purple-100 text-purple-800' }
const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

export default function Settings() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const [cafe, setCafe] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cafeForm, setCafeForm] = useState({})
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' })
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'Minuman', price: '', hpp: '' })
  const [editItemId, setEditItemId] = useState(null)

  const fetchData = useCallback(() => {
    Promise.all([api.get('/settings/cafe'), api.get('/menu')]).then(([cafeRes, menuRes]) => {
      setCafe(cafeRes.data)
      setCafeForm({ name: cafeRes.data.name, owner_name: cafeRes.data.owner_name, address: cafeRes.data.address || '', phone: cafeRes.data.phone || '' })
      setMenuItems(menuRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveCafe(e) {
    e.preventDefault()
    await api.put('/settings/cafe', cafeForm)
    toast.success(t('settings.saved'))
    refreshUser()
  }

  async function changePassword(e) {
    e.preventDefault()
    try {
      await api.put('/auth/change-password', pwForm)
      toast.success('Password berhasil diubah')
      setPwForm({ current_password: '', new_password: '' })
    } catch (err) {
      toast.error(formatApiError(err, 'Gagal mengubah password'))
    }
  }

  async function addMenuItem(e) {
    e.preventDefault()
    const priceValue = parseFloat(newItem.price)
    const hppValue = parseFloat(newItem.hpp) || 0
    const res = await api.post('/menu', { ...newItem, price: priceValue, hpp: hppValue })
    toast.success('Item berhasil ditambahkan')
    setShowAddMenu(false)
    setNewItem({ name: '', category: 'Minuman', price: '', hpp: '' })
    const created = {
      id: res.data.id,
      name: newItem.name,
      category: newItem.category,
      price: priceValue,
      hpp: hppValue,
      margin_pct: priceValue > 0 ? (priceValue - hppValue) / priceValue * 100 : 0,
      is_active: true,
    }
    const nextItems = [...menuItems, created].sort((a, b) => {
      const cat = (a.category || '').localeCompare(b.category || '')
      if (cat !== 0) return cat
      return (a.name || '').localeCompare(b.name || '')
    })
    setMenuItems(nextItems)
  }

  async function deleteMenuItem(id) {
    if (!confirm(t('common.confirm_delete'))) return
    await api.delete(`/menu/${id}`)
    toast.success('Item dihapus')
    setMenuItems(menuItems.filter(i => i.id !== id))
  }

  async function updateHPP(id, hpp) {
    await api.put(`/menu/${id}`, { hpp: parseFloat(hpp) })
    setMenuItems(menuItems.map(i => i.id === id ? { ...i, hpp: parseFloat(hpp), margin_pct: (i.price - parseFloat(hpp)) / i.price * 100 } : i))
    setEditItemId(null)
    toast.success('HPP diperbarui')
  }

  if (loading) return <AppLayout title={t('nav.settings')}><div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" /></div></AppLayout>

  return (
    <AppLayout title={t('nav.settings')}>
      <div className="space-y-5 max-w-3xl">
        {/* Cafe Profile */}
        <div className="card">
          <h3 className="font-semibold text-brand-800 mb-4">{t('settings.cafe_profile')}</h3>
          {cafe && (
            <div className="mb-3 flex items-center gap-2">
              <span className={clsx('badge-level', LEVEL_COLORS[cafe.subscription_level] || 'bg-gray-100 text-gray-700')}>
                Level {cafe.subscription_level}: {LEVEL_NAMES[cafe.subscription_level]}
              </span>
            </div>
          )}
          <form onSubmit={saveCafe} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">{t('settings.cafe_name')}</label><input className="input" value={cafeForm.name || ''} onChange={(e) => setCafeForm({ ...cafeForm, name: e.target.value })} required /></div>
            <div><label className="label">{t('settings.owner_name')}</label><input className="input" value={cafeForm.owner_name || ''} onChange={(e) => setCafeForm({ ...cafeForm, owner_name: e.target.value })} required /></div>
            <div><label className="label">{t('settings.address')}</label><input className="input" value={cafeForm.address || ''} onChange={(e) => setCafeForm({ ...cafeForm, address: e.target.value })} /></div>
            <div><label className="label">{t('settings.phone')}</label><input className="input" value={cafeForm.phone || ''} onChange={(e) => setCafeForm({ ...cafeForm, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><button type="submit" className="btn-primary">{t('settings.save')}</button></div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 className="font-semibold text-brand-800 mb-4">{t('settings.password_title')}</h3>
          <form onSubmit={changePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">{t('settings.current_password')}</label><input type="password" className="input" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required /></div>
            <div><label className="label">{t('settings.new_password')}</label><input type="password" className="input" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required /></div>
            <div><button type="submit" className="btn-primary">{t('settings.change_password')}</button></div>
          </form>
        </div>

        {/* Menu Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-800">{t('settings.menu_title')} ({menuItems.length} items)</h3>
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={14} />{t('settings.add_item')}
            </button>
          </div>

          {showAddMenu && (
            <form onSubmit={addMenuItem} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1"><label className="label">{t('settings.item_name')}</label><input className="input" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required /></div>
              <div><label className="label">{t('settings.category')}</label>
                <select className="input" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                  {['Minuman', 'Makanan', 'Dessert', 'Snack', 'Lainnya'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">{t('settings.price')}</label><input type="number" className="input" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required /></div>
              <div><label className="label">{t('settings.hpp')}</label><input type="number" className="input" value={newItem.hpp} onChange={(e) => setNewItem({ ...newItem, hpp: e.target.value })} /></div>
              <div className="col-span-2 sm:col-span-4 flex gap-2">
                <button type="submit" className="btn-primary text-sm">{t('common.add')}</button>
                <button type="button" onClick={() => setShowAddMenu(false)} className="btn-outline text-sm">{t('common.cancel')}</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-200">
                  {['Item', 'Kategori', 'Harga', 'HPP', 'Margin %', ''].map((h) => (
                    <th key={h} className="text-left pb-2 pr-3 text-brand-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id} className="border-b border-brand-100 hover:bg-brand-50">
                    <td className="py-2 pr-3 font-medium text-brand-800">{item.name}</td>
                    <td className="py-2 pr-3 text-brand-500">{item.category}</td>
                    <td className="py-2 pr-3">{formatIDR(item.price)}</td>
                    <td className="py-2 pr-3">
                      {editItemId === item.id ? (
                        <input
                          type="number"
                          defaultValue={item.hpp}
                          className="input w-24 py-1 text-xs"
                          onBlur={(e) => updateHPP(item.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && updateHPP(item.id, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer hover:text-brand-600" onClick={() => setEditItemId(item.id)}>
                          {formatIDR(item.hpp)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={clsx('font-semibold text-xs',
                        item.margin_pct < 20 ? 'text-red-600' : item.margin_pct < 40 ? 'text-amber-600' : 'text-green-700')}>
                        {item.margin_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItemId(item.id)} className="text-brand-400 hover:text-brand-700 p-1">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteMenuItem(item.id)} className="text-brand-300 hover:text-red-500 p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
