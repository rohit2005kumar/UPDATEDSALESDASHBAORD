import { BarChart3 } from 'lucide-react'

const dayKey = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function DailyOrdersChart({ orders, fromDate, toDate }) {
  const start = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)
  const counts = new Map()
  orders.forEach(order => counts.set(dayKey(order.createdAt), (counts.get(dayKey(order.createdAt)) || 0) + 1))
  const days = []
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = dayKey(date)
    days.push({ key, date: new Date(date), count: counts.get(key) || 0 })
  }
  const max = Math.max(1, ...days.map(day => day.count))
  const compact = days.length > 14
  const chartMinWidth = compact ? `${days.length * 54}px` : '100%'
  return <section className="dashboard-card p-5">
    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf2e5] text-brand"><BarChart3 size={18}/></span><div><h2 className="dashboard-title text-sm">Orders per day</h2><p className="mt-1 text-[10px] text-muted">{orders.length} orders during the selected period</p></div></div>
    <div className="dashboard-table-scroll mt-6 pb-2"><div className="grid h-64 items-end gap-2 border-b border-line px-3 sm:h-72" style={{ minWidth: chartMinWidth, gridTemplateColumns: `repeat(${Math.max(1, days.length)}, minmax(42px, 1fr))` }}>
      {days.map(day => <div key={day.key} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
        <span className="text-xs font-extrabold text-brand">{day.count}</span>
        <div title={`${day.key}: ${day.count} orders`} className={`${compact ? 'w-7' : 'w-[55%] max-w-16 min-w-8'} rounded-t-xl bg-gradient-to-t from-brand-dark to-[#9bb674] shadow-[0_8px_18px_rgba(98,122,61,.18)] transition-all duration-300`} style={{ height: `${Math.max(day.count ? 18 : 3, (day.count / max) * 190)}px` }}/>
        <span className="pb-3 text-center text-[9px] font-semibold text-muted">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(day.date)}</span>
      </div>)}
    </div></div>
    {!orders.length && <p className="mt-4 text-center text-xs text-muted">No orders were placed in this date range.</p>}
  </section>
}
