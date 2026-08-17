import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'

const DAY = 24 * 60 * 60 * 1000
const ranges = [
  { label: 'Last 4 weeks', value: 4 },
  { label: 'Last 8 weeks', value: 8 },
  { label: 'Last 12 weeks', value: 12 },
]

const startOfWeek = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

const weekLabel = date => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
}).format(date)

export default function WeeklyOrdersChart({ orders }) {
  const [weekCount, setWeekCount] = useState(8)

  const weeklyOrders = useMemo(() => {
    const currentWeek = startOfWeek(new Date())
    const weeks = Array.from({ length: weekCount }, (_, index) => {
      const start = new Date(currentWeek.getTime() - ((weekCount - 1 - index) * 7 * DAY))
      return { key: start.toISOString().slice(0, 10), start, count: 0 }
    })
    const byWeek = new Map(weeks.map(week => [week.key, week]))

    orders.forEach(order => {
      const start = startOfWeek(order.createdAt)
      const week = start && byWeek.get(start.toISOString().slice(0, 10))
      if (week) week.count += 1
    })

    return weeks
  }, [orders, weekCount])

  const maxOrders = Math.max(1, ...weeklyOrders.map(week => week.count))
  const totalOrders = weeklyOrders.reduce((sum, week) => sum + week.count, 0)
  const baseline = 150
  const barAreaHeight = 118
  const slotWidth = 598 / weeklyOrders.length
  const barWidth = 30

  return <section className="dashboard-card p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[#edf2ef] text-brand"><BarChart3 size={17} /></span>
        <div>
          <h2 className="dashboard-title text-sm">Orders placed by week</h2>
          <p className="mt-1 text-[10px] text-muted">{totalOrders} orders in the selected period</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[10px] font-bold text-muted">
        Period
        <select value={weekCount} onChange={event => setWeekCount(Number(event.target.value))} className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-ink outline-none focus:border-brand">
          {ranges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
        </select>
      </label>
    </div>

    <div className="dashboard-table-scroll mt-6">
      <svg viewBox="0 0 640 190" className="min-w-[640px] w-full" role="img" aria-label={`Weekly order chart showing ${totalOrders} orders across ${weekCount} weeks`}>
        <title>Orders placed by week</title>
        {[0, 0.5, 1].map(ratio => {
          const y = baseline - (barAreaHeight * ratio)
          return <g key={ratio}>
            <line x1="34" x2="632" y1={y} y2={y} stroke="#e7e2d7" strokeWidth="1" />
            <text x="27" y={y + 4} textAnchor="end" fill="#7c7d74" fontSize="10">{Math.round(maxOrders * ratio)}</text>
          </g>
        })}
        {weeklyOrders.map((week, index) => {
          const height = (week.count / maxOrders) * barAreaHeight
          const x = 34 + (index * slotWidth) + ((slotWidth - barWidth) / 2)
          const y = baseline - height
          return <g key={week.key}>
            <rect x={x} y={y} width={barWidth} height={height} rx="6" fill="#627a3d">
              <title>{weekLabel(week.start)}: {week.count} orders</title>
            </rect>
            <text x={x + (barWidth / 2)} y={Math.max(20, y - 7)} textAnchor="middle" fill="#46572d" fontSize="11" fontWeight="700">{week.count}</text>
            <text x={x + (barWidth / 2)} y="174" textAnchor="middle" fill="#7c7d74" fontSize="9">{weekLabel(week.start)}</text>
          </g>
        })}
      </svg>
    </div>
    {!totalOrders && <p className="mt-2 text-center text-xs text-muted">No orders were placed during this period.</p>}
  </section>
}
