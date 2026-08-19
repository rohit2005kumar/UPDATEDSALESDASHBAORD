import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarDays, ChevronLeft, ChevronRight, FileText, Link2, MapPin, MoreVertical, Search, ShoppingCart, SlidersHorizontal, Truck, UserRound, Users, X } from 'lucide-react'
import SalesSidebar from '../components/sales/SalesSidebar'
import SalesTopbar from '../components/sales/SalesTopbar'
import MessageDeliveryTable from '../components/sales/MessageDeliveryTable'
import RecentSalesOrders from '../components/sales/RecentSalesOrders'
import StatusBadge from '../components/sales/StatusBadge'
import DailyOrdersChart from '../components/sales/DailyOrdersChart'
import { useSalesData } from '../context/SalesDataContext'
import { useAuth } from '../context/AuthContext'
import { DashboardSkeleton } from '../components/sales/LoadingSkeleton'

const definitions = {
  customers: { title: 'Customers', subtitle: 'Customers registered by you during assisted calls', icon: Users },
  orders: { title: 'Orders', subtitle: 'Your assisted sales orders and their current status', icon: FileText },
  'payment-links': { title: 'Payment Links', subtitle: 'Generated links and their current payment status', icon: Link2 },
  'message-deliveries': { title: 'Message Deliveries', subtitle: 'SMS and WhatsApp delivery attempts', icon: Truck },
  reports: { title: 'Reports', subtitle: 'A read-only snapshot of your assisted-sales performance', icon: BarChart3 },
  profile: { title: 'Profile', subtitle: 'Your sales desk account and operating mode', icon: UserRound },
}

const customerAvatarTones = [
  'bg-[#eaf0e4] text-[#4e6b34]',
  'bg-[#f4e8f3] text-[#8a4890]',
  'bg-[#fbe8df] text-[#b7542e]',
  'bg-[#e4eef7] text-[#3870a3]',
  'bg-[#f8eedc] text-[#a97427]',
]

const CUSTOMER_PAGE_SIZE = 9
const ORDER_PAGE_SIZE = 10
const PAYMENT_LINK_PAGE_SIZE = 10
const  formatCustomerDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} • ${formattedTime}`;
};

// const formatCustomerDate = value => {
//   if (!value) return ''
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return ''
//   return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
// }

export default function SalesWorkspacePage() {
  const { section } = useParams()
  const page = definitions[section] || definitions.orders
  const Icon = page.icon
  const [menu, setMenu] = useState(false)
  const salesData = useSalesData()
  const { user } = useAuth()

  return <div className="dashboard-shell min-h-screen">
    <SalesSidebar open={menu} setOpen={setMenu} />
    <div className="lg:pl-64">
      <SalesTopbar />
      <main className="dashboard-main mx-auto max-w-[1700px] space-y-5">
        <header className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-[#e9eddf] text-brand"><Icon size={20} /></span>
          <div className="min-w-0"><h1 className="dashboard-title text-xl">{page.title}</h1><p className="mt-1 text-xs text-muted">{page.subtitle}</p></div>
        </header>
        {
          salesData.loading ? <DashboardSkeleton message={`Loading ${page.title.toLowerCase()}…`} /> :
            <SectionContent section={section} user={user} {...salesData} />}
      </main>
    </div>
  </div>
}

function SectionContent({ section, customers, orders, deliveries, paymentLinks, user }) {
  const agent=JSON.parse(localStorage.getItem('agent'))
  const name=agent.split('.')[0]
  if (section === 'orders') return <OrdersSection orders={orders} />
  if (section === 'message-deliveries') return <MessageDeliveryTable rows={deliveries} />
  if (section === 'customers') return <CustomersSection customers={customers} />
  if (section === 'payment-links') return <PaymentLinksSection paymentLinks={paymentLinks} />
  if (section === 'reports') return <ReportsSection orders={orders} customers={customers} />
  return <article className="dashboard-card max-w-xl p-4 sm:p-6">
    <div className="grid size-14 place-items-center rounded-full bg-brand text-lg font-extrabold text-white">{name.split('')[0].toUpperCase()}</div>
    <h2 className="mt-4 text-lg font-extrabold">{agent}</h2><p className="text-xs text-muted">{user.role}</p>
    <dl className="mt-6 grid gap-3 rounded-xl bg-stone-50 p-4 text-xs sm:grid-cols-2">
      <dt className="text-muted">Workspace</dt><dd className="font-bold">Sales desk</dd>
      <dt className="text-muted">Data source</dt><dd className="font-bold">Live sales data</dd>
      <dt className="text-muted">Payment truth</dt><dd className="font-bold">Razorpay webhook</dd>
    </dl>
  </article>
}

const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function ReportsSection({ orders, customers }) {
  const today = localDateKey(new Date())
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const [fromDate, setFromDate] = useState(localDateKey(sevenDaysAgo))
  const [toDate, setToDate] = useState(today)
  const setPreset = days => { const start = new Date(); start.setDate(start.getDate() - (days - 1)); setFromDate(localDateKey(start)); setToDate(today) }
  const resetFilters = () => setPreset(7)
  const inRange = value => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return false
    return date >= new Date(`${fromDate}T00:00:00`) && date <= new Date(`${toDate}T23:59:59.999`)
  }
  const filteredOrders = orders.filter(order => inRange(order.createdAt))
  const createdCustomers = customers.filter(customer => inRange(customer.created_at)).length
  const isPaid = order => ['paid', 'success', 'captured'].includes(String(order.payment || '').toLowerCase())
  const paid = filteredOrders.filter(isPaid).length
  const pending = filteredOrders.length - paid
  const totalRevenue = filteredOrders
    .filter(isPaid)
    .reduce((sum, order) => sum + (Number.parseFloat(order.amount) || 0), 0)
  const formattedRevenue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(totalRevenue)
  const todayPaid = orders.filter(order => localDateKey(new Date(order.createdAt)) === today && isPaid(order)).length
  const cards = [['Total revenue', formattedRevenue], ['Total Paid orders', paid], ["Today's Paid Orders", todayPaid], ['Pending orders', pending], ['Customers created', createdCustomers], ['Total orders', filteredOrders.length]]
  return <div className="space-y-5">
    <section className="dashboard-card p-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="dashboard-title text-sm">Report filters</h2><p className="mt-1 text-[10px] text-muted">Choose a preset or custom daily range</p></div><div className="flex flex-wrap gap-2">{[[1, 'Today'], [7, '7 days'], [30, '30 days']].map(([days, label]) => <button key={days} type="button" onClick={() => setPreset(days)} className="rounded-lg border border-line px-3 py-2 text-[10px] font-bold text-brand hover:bg-[#f3f6ea]">{label}</button>)}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[9px] font-bold text-muted">FROM<input type="date" value={fromDate} max={toDate} 
        onChange={event => setFromDate(event.target.value)} 
        className="mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink" />
        </label>
        <label className="text-[9px] font-bold text-muted">TO<input type="date" value={toDate} min={fromDate} max={today} 
        onChange={event => setToDate(event.target.value)} 
        className="mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink"
         />
      </label>
      </div>
            <button type="button" onClick={resetFilters} className="rounded-lg bg-brand px-3 py-2 text-[10px] font-bold text-white hover:bg-brand-dark">Reset filters</button>

      </div>
      </section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map(([label, value]) => <article key={label} 
      className="dashboard-card border-t-4 border-t-brand p-5 hover:text-[#627A3D]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-[#627A3D]">
          {label}
      </p>
      <div className={`dashboard-title mt-3 ${label === 'Total revenue' ? 'text-2xl' : 'text-3xl'}`}>
        {value}
        </div>
        </article>)}
      </div>
    <DailyOrdersChart orders={filteredOrders} fromDate={fromDate} toDate={toDate} />
  </div>
}

// function PaymentLinksSection({ paymentLinks }) {
//   const filterOptions = useMemo(() => {
//   return [
//     ...new Set(
//       paymentLinks
//         .map((item) => item.status)
//         .filter(Boolean)
//     ),
//   ];
// }, [paymentLinks]);
// const [selectedFilter,setSelectedFilter]=useState('')
 
//   const [currentPage, setCurrentPage] = useState(1)
//   const totalPages = Math.max(1, Math.ceil(paymentLinks.length / PAYMENT_LINK_PAGE_SIZE))
//   const page = Math.min(currentPage, totalPages)
//   const rows = paymentLinks.slice((page - 1) * PAYMENT_LINK_PAGE_SIZE, page * PAYMENT_LINK_PAGE_SIZE).filter((item)=>item.status===selectedFilter)
//   // .filter((item)=>item.status===selectedFilter)
//   // .slice((page - 1) * PAYMENT_LINK_PAGE_SIZE, page * PAYMENT_LINK_PAGE_SIZE)
 
//   console.log(selectedFilter)

//   return <div className="space-y-4">
//     <div className="dashboard-card overflow-hidden"><div className="overflow-x-auto">
//       {/* filter selection  */}
//        <select name="filter" id="filter"
//        value={selectedFilter}
//        onChange={(e)=>{setSelectedFilter(e.target.value)}}
//        >
//         <option value="" >slecet filter</option>
//         {
//           filterOptions.map((item,index)=>{
//             return <option key={item} value={item}
//             >{item}</option>
//           })
//         }
//        </select>
//     <table className="w-full min-w-[1100px] text-left text-xs">
//     <thead 
//     // onClick={()=>{console.log(paymentLinks)}}
//     className="bg-[#faf9f5] text-[10px] text-muted"><tr>
//       {['Order', 'Customer', 'Amount', 'Created', 'Expires', 'Link status', 'Payment status', 'Channel mode', 'Used'].map(label => <th key={label} 
//       className="px-4 py-3 font-semibold">{label}</th>)}
//       </tr>
//       </thead>
//     <tbody>
//       {!paymentLinks.length && <tr><td colSpan="9" className="p-8 text-center text-xs text-muted">No payment links have been generated yet.</td></tr>}
//       {rows.map(link => <tr key={link.id || link.order} className="border-t border-line">
//         <td className="px-4 py-3 font-bold">{link.order}</td><td className="px-4 py-3 font-semibold">{link.customer || '—'}</td><td className="px-4 py-3 font-bold">₹{link.amount || '0.00'}</td>
//         <td className="px-4 py-3">{formatCustomerDate(link.createdAt) || '—'}</td><td className="px-4 py-3">{formatCustomerDate(link.expiresAt) || '—'}</td>
//         <td className="px-4 py-3"><StatusBadge>{link.status || 'Unknown'}</StatusBadge></td><td className="px-4 py-3"><StatusBadge>{link.paymentStatus || 'Pending'}</StatusBadge></td>
//         <td className="px-4 py-3">{link.sentChannels?.length ? link.sentChannels.join(', ') : 'Not sent'}</td><td className="px-4 py-3">{formatCustomerDate(link.usedAt) || 'Not used'}</td>
//       </tr>)}
//     </tbody></table></div></div>
//     {paymentLinks.length > PAYMENT_LINK_PAGE_SIZE && <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />}
//   </div>
// }
function PaymentLinksSection({ paymentLinks }) {
  console.log(paymentLinks)
  const [selectedFilter, setSelectedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create unique filter options
  const filterOptions = useMemo(() => {
    return [
      ...new Set(
        paymentLinks
          .map((item) => item.status)
          .filter(Boolean)
      ),
    ];
  }, [paymentLinks]);

  // Filter FIRST
  const filteredPaymentLinks = useMemo(() => {
    if (!selectedFilter) {
      return paymentLinks;
    }

    return paymentLinks.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        selectedFilter.toLowerCase()
    );
  }, [paymentLinks, selectedFilter]);
  

  // Pagination should use filtered data
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPaymentLinks.length / PAYMENT_LINK_PAGE_SIZE)
  );

  const page = Math.min(currentPage, totalPages);

  // Paginate AFTER filtering
  const rows = filteredPaymentLinks.slice(
    (page - 1) * PAYMENT_LINK_PAGE_SIZE,
    page * PAYMENT_LINK_PAGE_SIZE
  );

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);

    
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">

          {/* FILTER */}
          <div className="responsive-actions justify-stretch p-4 sm:justify-end">
            <select
              name="filter"
              id="filter"
              value={selectedFilter}
              onChange={handleFilterChange}
              className="min-w-0 flex-1 rounded-xl border border-line bg-[#faf9f5] px-4 py-3 text-xs outline-none focus:border-brand sm:flex-none"
            >
              <option value="">Payment Link Status</option>

              {filterOptions.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
            <button 
            onClick={()=>{setSelectedFilter('')}}
            disabled={!selectedFilter}
            className="flex-1 rounded-xl border border-line bg-[#faf9f5] px-4 py-3 text-xs outline-none focus:border-brand disabled:opacity-50 sm:flex-none"
              >Rest Filter</button>
          </div>

          {/* TABLE */}
          <table className="w-full min-w-[1100px] text-left text-xs">

            <thead className="bg-[#faf9f5] text-[10px] text-muted">
              <tr>   
                {[
                  "Order",
                  "Customer",
                  "Amount",
                  "Created",
                  "Expires",
                  "Link status",
                  "Payment status",
                  "Channel mode",
                  "Used",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 font-semibold"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {!rows.length && (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-xs text-muted"
                  >
                    {selectedFilter
                      ? `No payment links found for "${selectedFilter}".`
                      : "No payment links have been generated yet."}
                  </td>
                </tr>
              )}

              {rows.map((link) => (
                <tr
                  key={link.id || link.order}
                  className="border-t border-line"
                >
                  <td className="px-4 py-3 font-bold">
                    {link.order}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {link.customer || "—"}
                  </td>

                  <td className="px-4 py-3 font-bold">
                    ₹{link.amount || "0.00"}
                  </td>

                  <td className="px-4 py-3">
                    {formatCustomerDate(link.createdAt) || "—"}
                   
                  </td>

                  <td className="px-4 py-3">
                    {formatCustomerDate(link.expiresAt) || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge>
                      {link.status || "Unknown"}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge>
                      {link.paymentStatus || "Pending"}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-3">
                    {link.sentChannels?.length
                      ? link.sentChannels.join(", ")
                      : "Not sent"}
                  </td>

                  <td className="px-4 py-3">
                    {formatCustomerDate(link.usedAt) || "Not used"}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>

        </div>
      </div>

      {/* Pagination based on FILTERED data */}
      {filteredPaymentLinks.length > PAYMENT_LINK_PAGE_SIZE && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function CustomersSection({ customers }) {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredCustomers = useMemo(() => customers.filter(customer => {
    if (!normalizedQuery) return true
    const name = String(customer.full_name || '').toLowerCase()
    const phone = String(customer.phone || '').replace(/\s/g, '')
    const phoneQuery = normalizedQuery.replace(/\s/g, '')
    return name.includes(normalizedQuery) || phone.includes(phoneQuery)
  }), [customers, normalizedQuery])
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMER_PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginatedCustomers = filteredCustomers.slice((page - 1) * CUSTOMER_PAGE_SIZE, page * CUSTOMER_PAGE_SIZE)

  return <div className="space-y-5">
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <div className="dashboard-card p-4">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-[#fffefa] px-4 py-3.5 focus-within:border-brand">
          <Search size={18} className="shrink-0 text-brand" />
          <input
            value={query}
            onChange={event => { setQuery(event.target.value); setCurrentPage(1) }}
            className="w-full border-none bg-transparent text-xs outline-none"
            placeholder="Search by customer name or mobile number"
            aria-label="Search customers by name or mobile number"
          />
          {query && <button type="button" onClick={() => { setQuery(''); setCurrentPage(1) }} className="rounded-full p-1 text-muted hover:bg-stone-50" aria-label="Clear customer search"><X size={14} /></button>}
        </label>
      </div>
      <div className="dashboard-card flex items-center justify-center px-6 py-4 text-xs text-muted md:min-w-44"><b className="mr-1.5 text-base text-brand">{filteredCustomers.length}</b> of {customers.length} customers</div>
    </div>

    {filteredCustomers.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {paginatedCustomers.map((customer, index) => <article key={customer.id} className="dashboard-card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
        <Link to={'/sales-dashboard/customers/' + customer.id} className="block p-5">
          <div className="flex items-start gap-4">
            <div className={'grid size-14 shrink-0 place-items-center rounded-full text-lg font-extrabold ' + customerAvatarTones[index % customerAvatarTones.length]}>{customer.full_name?.[0]?.toUpperCase() || 'C'}</div>
            <div className="min-w-0 flex-1">
              <h2 className="dashboard-title truncate text-base group-hover:text-brand">{customer.full_name || 'Unnamed customer'}</h2>
              <p className="mt-1 text-xs text-muted">{customer.phone || 'No phone number'}</p>
            </div>
            <MoreVertical size={17} className="shrink-0 text-muted" aria-hidden="true" />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted">
            <span className="flex min-w-0 items-center gap-2">
              {customer.city || customer.state ? <MapPin size={14} className="shrink-0" /> : <CalendarDays size={14} className="shrink-0" />}
              <span className="truncate">{[customer.city, customer.state].filter(Boolean).join(', ') || (formatCustomerDate(customer.created_at) ? 'Registered on ' + formatCustomerDate(customer.created_at) : 'Customer record')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e6d8] bg-[#f5f6ef] px-2.5 py-1 font-bold text-brand"><span className="size-1.5 rounded-full bg-brand" />Registered</span>
          </div>
        </Link>
        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-line px-5 py-3 text-xs font-bold sm:flex-row sm:items-center">
          <Link to={'/sales-dashboard/customers/' + customer.id} className="inline-flex items-center gap-1.5 text-muted hover:text-brand">View details<ArrowRight size={14} /></Link>
          <div className="flex items-center gap-2"><Link to={`/sales-dashboard/customers/${customer.id}?edit=1`} className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-brand hover:bg-[#f5f6ef] sm:flex-none">Edit</Link><Link to={`/sales-dashboard/create-order?customerId=${encodeURIComponent(customer.id)}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-dark sm:flex-none"><ShoppingCart size={13} />Create order</Link></div>
        </div>
      </article>)}
    </div> : <div className="dashboard-card p-12 text-center text-xs text-muted">No customers match “{query}”.</div>}
    {filteredCustomers.length > CUSTOMER_PAGE_SIZE && <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />}
  </div>
}

function OrdersSection({ orders }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);
  console.log(orders)

  const statuses = useMemo(() => [...new Set(
    orders
      .map(order => String(order.status || '').trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b)), [orders])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return orders.filter(order => {
      const orderId = String(order.orderNumber || order.id || '').toLowerCase()
      const customerName = String(order.customer || '').toLowerCase()
      const matchesQuery = !normalizedQuery || orderId.includes(normalizedQuery) || customerName.includes(normalizedQuery)
      const matchesStatus = !status || String(order.status || '').toLowerCase() === status
      const createdAt = order.createdAt ? new Date(order.createdAt) : null
      const validCreatedAt = createdAt && !Number.isNaN(createdAt.getTime())
      const matchesFrom = !from || (validCreatedAt && createdAt >= from)
      const matchesTo = !to || (validCreatedAt && createdAt <= to)
      return matchesQuery && matchesStatus && matchesFrom && matchesTo
    }).sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
  }, [orders, query, status, fromDate, toDate])
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginatedOrders = filteredOrders.slice((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE)

  const hasFilters = query || status || fromDate || toDate
  const clearFilters = () => {
    setQuery('')
    setStatus('')
    setFromDate('')
    setToDate('')
    setCurrentPage(1)
  }

  return <div className="space-y-4">
    <div className="dashboard-card p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-ink"><SlidersHorizontal size={15} className="text-brand" />Filter orders</div>
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_170px_170px_auto]">
        <label className="flex items-center gap-3 rounded-xl border border-line bg-[#faf9f5] px-3.5 py-3 focus-within:border-brand">
          <Search size={16} className="shrink-0 text-brand" />
          <input value={query} onChange={event => { setQuery(event.target.value); setCurrentPage(1) }} className="w-full bg-transparent text-xs outline-none border-none" placeholder="Order ID or customer name" aria-label="Search by order ID or customer name" />
        </label>
        <label className="relative">
          <span className="sr-only">Order Status</span>
          <select value={status} onChange={event => { setStatus(event.target.value); setCurrentPage(1) }} className="h-full w-full rounded-xl border border-line bg-[#faf9f5] px-3.5 py-3 text-xs outline-none focus:border-brand">
            <option value=""> All Orders</option>
            {statuses.map(orderStatus => <option key={orderStatus} value={orderStatus.toLowerCase()}>{orderStatus}</option>)}
          </select>
        </label>
        <label
          className="flex items-center gap-2 rounded-xl border border-line bg-[#faf9f5] px-3 py-2 focus-within:border-brand cursor-pointer"
          htmlFor="fromdate"
          onClick={() => {
            fromDateRef.current?.showPicker?.();
            fromDateRef.current?.focus();
          }}
        >
          <CalendarDays size={15} className="shrink-0 text-brand" />

          <span className="min-w-0 text-[9px] font-bold text-muted">
            FROM
            <input
              ref={fromDateRef}
              id="fromdate"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setCurrentPage(1);
              }}
              className="block w-full bg-transparent text-[10px] text-ink outline-none cursor-pointer"
            />
          </span>
        </label>


        <label
          className="flex items-center gap-2 rounded-xl border border-line bg-[#faf9f5] px-3 py-2 focus-within:border-brand cursor-pointer"
          htmlFor="todate"
          onClick={() => {
            toDateRef.current?.showPicker?.();
            toDateRef.current?.focus();
          }}
        >
          <CalendarDays size={15} className="shrink-0 text-brand" />

          <span className="min-w-0 text-[9px] font-bold text-muted">
            TO
            <input
              ref={toDateRef}
              id="todate"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDate(event.target.value);
                setCurrentPage(1);
              }}
              className="block w-full bg-transparent text-[10px] text-ink outline-none cursor-pointer"
            />
          </span>
        </label>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={clearFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-xs font-bold text-muted hover:bg-[#faf9f5] disabled:cursor-default disabled:opacity-40">
          <X size={14} />
          Clear
        </button>
      </div>
    </div>
    <RecentSalesOrders orders={paginatedOrders} title="All orders" showViewAll={false} />
    <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />
  </div>
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return <nav className="dashboard-card flex flex-col items-stretch justify-between gap-3 p-3 sm:flex-row sm:items-center" aria-label="Pagination">
    <p className="px-1 text-[10px] font-semibold text-muted">

      Page {currentPage} of {totalPages}

    </p>
    <div className="flex items-center justify-between gap-1.5 sm:justify-start">
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="grid size-9 place-items-center rounded-lg border border-line text-brand hover:bg-[#f5f6ef] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => <button type="button" key={pageNumber} onClick={() => onPageChange(pageNumber)} aria-current={pageNumber === currentPage ? 'page' : undefined} className={`grid size-9 place-items-center rounded-lg text-[10px] font-bold ${pageNumber === currentPage ? 'bg-brand text-white' : 'border border-line text-muted hover:bg-[#f5f6ef]'}`}>{pageNumber}</button>)}
      <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="grid size-9 place-items-center rounded-lg border border-line text-brand hover:bg-[#f5f6ef] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
    </div>
  </nav>
}
