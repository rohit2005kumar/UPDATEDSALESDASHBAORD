import { ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { money } from './OrderSummary'

export default function RecentSalesOrders({ orders, title = 'Recent sales orders', showViewAll = true }) {
  const navigate = useNavigate()
  const openOrder = id => navigate(`/sales-dashboard/orders/${id}`)

  return <div className="dashboard-card overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
      <div className="min-w-0"><h3 className="dashboard-title text-sm">{title}</h3><p className="mt-1 text-[9px] text-muted">{orders.length} matching {orders.length === 1 ? 'order' : 'orders'} · click a row to view details</p></div>
      {showViewAll && <Link to="/sales-dashboard/orders" className="rounded-lg border border-line px-3 py-1.5 text-[10px] font-bold text-brand">View all</Link>}
    </div>
    <div className="dashboard-table-scroll">
      <table className="w-full min-w-[1000px] text-left text-[10px]">
        <thead className="bg-[#faf9f5] text-muted"><tr>{['Order ID','Customer','Phone','Amount','Payment Status','Order Status','Message Status','Created At','Action'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{orders.map(order => <tr
          key={order.id}
          tabIndex={0} //
          role="link"
          onClick={() => openOrder(order.id)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') openOrder(order.id)
          }}
          className="cursor-pointer border-t border-line outline-none hover:bg-stone-50 focus:bg-stone-50"
        >
          <td className="px-4 py-3 font-bold">{order.orderNumber || order.id}</td>
          <td className="px-4 py-3 font-semibold">{order.customer}</td>
          <td className="px-4 py-3">{order.phone}</td>
         
          <td className="px-4 py-3 font-bold">{money(order.amount)}</td>
          <td className="px-4 py-3"><StatusBadge>{order.payment}</StatusBadge></td>
          <td className="px-4 py-3"><StatusBadge>{order.status}</StatusBadge></td>
          <td className="px-4 py-3"><StatusBadge>{order.message}</StatusBadge></td>
          <td className="px-4 py-3">{order.created}</td>
          <td className="px-4 py-3"><Link onClick={event => event.stopPropagation()} to={`/sales-dashboard/orders/${order.id}`} aria-label={`View ${order.orderNumber || order.id}`} className="inline-flex rounded-lg border border-line p-1.5 text-brand"><ArrowUpRight size={12}/></Link></td>
        </tr>)}
        {!orders.length && <tr><td colSpan="9" className="px-4 py-12 text-center text-xs text-muted">No orders match the selected filters.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
