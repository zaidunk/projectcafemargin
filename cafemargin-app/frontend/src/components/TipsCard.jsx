'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

/**
 * TipsCard — bilingual tips and explanation card for every analytics screen.
 * Props:
 *   titleKey: i18n key for the card title (default "tips.title")
 *   tips: array of { icon, textKey, text } — at least one of textKey or text must be set
 *   color: "amber" | "blue" | "green" | "brand" (default "amber")
 *   defaultOpen: bool (default true)
 */
export default function TipsCard({ titleKey, tips = [], color = 'amber', defaultOpen = true, className }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)

  const colors = {
    amber: { bg: 'bg-amber-50 border-amber-200', header: 'text-amber-800', icon: 'text-amber-500', tip: 'text-amber-700' },
    blue:  { bg: 'bg-blue-50  border-blue-200',  header: 'text-blue-800',  icon: 'text-blue-500',  tip: 'text-blue-700' },
    green: { bg: 'bg-green-50 border-green-200', header: 'text-green-800', icon: 'text-green-500', tip: 'text-green-700' },
    brand: { bg: 'bg-brand-50 border-brand-200', header: 'text-brand-800', icon: 'text-brand-500', tip: 'text-brand-700' },
  }
  const c = colors[color] || colors.amber
  const title = titleKey ? t(titleKey) : t('tips.title')

  return (
    <div className={clsx('rounded-xl border p-4', c.bg, className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx('flex items-center justify-between w-full text-left gap-2', c.header)}
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className={c.icon} />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className={c.icon} /> : <ChevronDown size={14} className={c.icon} />}
      </button>
      {open && tips.length > 0 && (
        <ul className={clsx('mt-3 space-y-1.5 text-xs', c.tip)}>
          {tips.map((tip, i) => {
            const text = tip.textKey ? t(tip.textKey) : tip.text
            return (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">{tip.icon || '💡'}</span>
                <span>{text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
