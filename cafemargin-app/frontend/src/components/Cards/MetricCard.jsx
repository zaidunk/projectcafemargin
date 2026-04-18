import { memo } from 'react'
import clsx from 'clsx'

const GRADIENTS = {
  brand:  'from-brand-700 via-brand-600 to-brand-500',
  green:  'from-emerald-700 via-emerald-600 to-emerald-500',
  amber:  'from-amber-700 via-amber-600 to-amber-500',
  red:    'from-red-700 via-red-600 to-red-500',
  blue:   'from-blue-700 via-blue-600 to-blue-500',
  purple: 'from-purple-700 via-purple-600 to-purple-500',
  teal:   'from-teal-700 via-teal-600 to-teal-500',
  rose:   'from-rose-700 via-rose-600 to-rose-500',
}

const MetricCard = memo(function MetricCard({ label, value, subvalue, icon: Icon, color = 'brand', trend, onClick, className }) {
  const gradient = GRADIENTS[color] || GRADIENTS.brand

  return (
    <div
      onClick={onClick}
      className={clsx(
        `metric-card bg-gradient-to-br ${gradient} animate-slide-up`,
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300',
        className
      )}
    >
      {/* Background icon */}
      {Icon && (
        <div className="absolute top-3 right-3 opacity-15 z-0">
          <Icon className="icon-lg" strokeWidth={1.5} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <p className="text-white/65 text-[var(--text-xxs)] font-bold uppercase tracking-[0.15em] mb-2">{label}</p>
        <p className="text-white text-[var(--text-xl)] font-extrabold leading-tight tracking-tight animate-count-up">{value}</p>
        {subvalue && <p className="text-white/55 text-[var(--text-xs)] mt-1.5 font-medium">{subvalue}</p>}
        {trend !== undefined && trend !== null && (
          <div className={clsx(
            'inline-flex items-center gap-1 mt-2.5 text-[var(--text-xxs)] font-bold px-2 py-0.5 rounded-full',
            trend >= 0 ? 'bg-white/20 text-white' : 'bg-red-900/40 text-red-200'
          )}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default MetricCard
