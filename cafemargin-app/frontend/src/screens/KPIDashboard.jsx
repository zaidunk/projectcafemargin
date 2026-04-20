import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/Layout/AppLayout'
import api from '../api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Plus, Check, Clock, Circle, Trash2 } from 'lucide-react'
import TipsCard from '../components/TipsCard'

const formatIDR = (v) => `Rp ${Number(v).toLocaleString('id-ID')}`

const STATUS_CONFIG = {
  todo: { label: 'Belum Dimulai', icon: Circle, color: 'text-brand-400', bg: 'bg-brand-50 border-brand-200' },
  in_progress: { label: 'Sedang Berjalan', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  done: { label: 'Selesai', icon: Check, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
}

export default function KPIDashboard() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({ action_text: '', assignee: '', due_date: '', status: 'todo' })

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get('/kpi/action-plans'),
      api.get('/kpi/targets'),
    ]).then(([plansRes, targetsRes]) => {
      setPlans(plansRes.data)
      setTargets(targetsRes.data)
    }).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function updatePlanStatus(id, status) {
    await api.put(`/kpi/action-plans/${id}`, { status })
    setPlans(plans.map(p => p.id === id ? { ...p, status } : p))
  }

  async function deletePlan(id) {
    if (!confirm(t('common.confirm_delete'))) return
    await api.delete(`/kpi/action-plans/${id}`)
    setPlans(plans.filter(p => p.id !== id))
    toast.success('Action plan dihapus')
  }

  async function addPlan(e) {
    e.preventDefault()
    if (!newPlan.action_text.trim()) return
    const res = await api.post('/kpi/action-plans', newPlan)
    toast.success('Action plan ditambahkan')
    setShowAddPlan(false)
    setNewPlan({ action_text: '', assignee: '', due_date: '', status: 'todo' })
    fetchData()
  }

  const doneCount = useMemo(() => plans.filter(p => p.status === 'done').length, [plans])
  const donePct = useMemo(() => (
    plans.length > 0 ? Math.round(doneCount / plans.length * 100) : 0
  ), [plans.length, doneCount])

  return (
    <AppLayout title={t('nav.kpi')}>
      <div className="space-y-5">
        <TipsCard
          titleKey="tips.title"
          color="brand"
          tips={(t('tips.kpi', { returnObjects: true }) || []).map((text, i) => ({ icon: ['🎯','📋','✅','📈'][i] || '💡', text }))}
        />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Gagal memuat data. Silakan coba lagi nanti.</div>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Targets */}
            {targets.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-800 mb-4">{t('kpi.kpi_title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {targets.map((target) => {
                    const pct = target.achievement_pct || 0
                    return (
                      <div key={target.id} className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                        <p className="text-xs text-brand-500 font-medium mb-1 truncate">{target.metric_name}</p>
                        <p className="text-lg font-bold text-brand-800">
                          {target.metric_name.toLowerCase().includes('margin') || target.metric_name.toLowerCase().includes('%')
                            ? `${target.target_value}%`
                            : formatIDR(target.target_value)}
                        </p>
                        {target.actual_value && (
                          <>
                            <div className="mt-2 h-2 bg-brand-200 rounded-full">
                              <div
                                className={clsx('h-2 rounded-full transition-all', pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-400')}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-brand-500 mt-1">{pct.toFixed(1)}% dari target</p>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action Plan */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-brand-800">{t('kpi.action_plan_title')}</h3>
                  {plans.length > 0 && (
                    <p className="text-sm text-brand-500 mt-0.5">{t('kpi.progress')}: {donePct}% ({doneCount}/{plans.length})</p>
                  )}
                </div>
                <button onClick={() => setShowAddPlan(!showAddPlan)} className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus size={15} />
                  {t('kpi.add_action')}
                </button>
              </div>

              {/* Progress bar */}
              {plans.length > 0 && (
                <div className="h-2 bg-brand-100 rounded-full mb-4">
                  <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${donePct}%` }} />
                </div>
              )}

              {/* Add form */}
              {showAddPlan && (
                <form onSubmit={addPlan} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 space-y-3">
                  <div>
                    <label className="label">{t('kpi.action_text')}</label>
                    <input className="input" placeholder="Deskripsi aksi yang harus dilakukan..."
                      value={newPlan.action_text} onChange={(e) => setNewPlan({ ...newPlan, action_text: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t('kpi.assignee')}</label>
                      <input className="input" placeholder="Nama penanggung jawab"
                        value={newPlan.assignee} onChange={(e) => setNewPlan({ ...newPlan, assignee: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">{t('kpi.due_date')}</label>
                      <input type="date" className="input"
                        value={newPlan.due_date} onChange={(e) => setNewPlan({ ...newPlan, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">{t('common.add')}</button>
                    <button type="button" onClick={() => setShowAddPlan(false)} className="btn-outline text-sm">{t('common.cancel')}</button>
                  </div>
                </form>
              )}

              {/* Plan list */}
              {plans.length === 0 ? (
                <p className="text-brand-400 text-sm text-center py-6">{t('common.no_data')}</p>
              ) : (
                <div className="space-y-2">
                  {plans.map((plan) => {
                    const cfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.todo
                    const StatusIcon = cfg.icon
                    return (
                      <div key={plan.id} className={clsx('flex items-start gap-3 p-3 rounded-xl border', cfg.bg)}>
                        <button
                          onClick={() => {
                            const next = plan.status === 'todo' ? 'in_progress' : plan.status === 'in_progress' ? 'done' : 'todo'
                            updatePlanStatus(plan.id, next)
                          }}
                          title="Klik untuk ganti status"
                        >
                          <StatusIcon size={18} className={cfg.color} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={clsx('text-sm font-medium', plan.status === 'done' ? 'line-through text-brand-400' : 'text-brand-800')}>
                            {plan.action_text}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-brand-400">
                            {plan.assignee && <span>👤 {plan.assignee}</span>}
                            {plan.due_date && <span>📅 {plan.due_date}</span>}
                            <span className={clsx('font-medium', cfg.color)}>{cfg.label}</span>
                          </div>
                        </div>
                        <button onClick={() => deletePlan(plan.id)} className="text-brand-300 hover:text-red-500 flex-shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Porter Value Chain */}
            <div className="card">
              <h3 className="font-semibold text-brand-800 mb-4">Porter Value Chain Analysis</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { label: 'Inbound Logistics', icon: '📦', desc: 'Supply bahan baku, penyimpanan, quality control' },
                  { label: 'Operations', icon: '⚙️', desc: 'Produksi minuman, SOP, efisiensi staf' },
                  { label: 'Outbound', icon: '🚀', desc: 'Delivery, packaging, kecepatan saji' },
                  { label: 'Marketing & Sales', icon: '📣', desc: 'Promo, loyalty, social media, marketplace' },
                  { label: 'Service', icon: '⭐', desc: 'Customer experience, complaint handling' },
                ].map(({ label, icon, desc }) => (
                  <div key={label} className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs font-bold text-brand-700 mb-1">{label}</p>
                    <p className="text-[var(--text-xs)] text-brand-500 leading-tight">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-brand-700 rounded-xl">
                <p className="text-xs text-brand-200 text-center font-medium">
                  Support Activities: HR & Training | Technology (CafeMargin) | Procurement | Infrastructure
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
