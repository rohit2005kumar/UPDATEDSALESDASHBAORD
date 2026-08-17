import { BarChart3, FileText, LayoutDashboard, Link2, Menu, Sparkles, Truck, UserRound, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const nav = [
  [LayoutDashboard,'Sales Dashboard','/sales-dashboard',true],
  [Users,'Customers','/sales-dashboard/customers'],
  [FileText,'Orders','/sales-dashboard/orders'],
  [Link2,'Payment Links','/sales-dashboard/payment-links'],
  [Truck,'Message Deliveries','/sales-dashboard/message-deliveries'],
  [BarChart3,'Reports','/sales-dashboard/reports'],
  [UserRound,'Profile','/sales-dashboard/profile'],
]
export default function SalesSidebar({ open, setOpen }) { 
  return <>
  <button onClick={()=>setOpen(true)} className="fixed left-4 top-4 z-30 rounded-xl bg-brand p-2.5 text-white shadow-lg lg:hidden" aria-label="Open menu"><Menu size={20}/></button>
  {open && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={()=>setOpen(false)} aria-label="Close menu overlay"/>}

  <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-[#fffefa] px-4 py-6 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>

    <div className="mb-8 flex items-center justify-between px-2">
      <div className="flex items-center gap-1">
        <img src="/ayudravya-logo.png" alt="Ayudravya" className="size-14 rounded-xl object-contain mix-blend-multiply" />
        <div>
          <div className="dashboard-title text-xl text-[#705019]">Ayudravya</div>
    
        </div>
      </div><button onClick={()=>setOpen(false)} className="lg:hidden"><X/>
            </button>
            </div>
    <nav className="space-y-1.5">
      {nav.map(([Icon,label,to,end])=><NavLink key={label} to={to} end={end} onClick={()=>setOpen(false)} className={({isActive})=>`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-semibold transition ${isActive?'bg-[#e8eddd] text-[#41572a]':'text-stone-600 hover:bg-[#f5f5ef] hover:text-brand'}`}><Icon size={17}/>{label}
    </NavLink>)}
    </nav>
    <div className="mt-auto rounded-2xl border border-[#e2e6d8] bg-[#f5f6ef] p-4">
      <Sparkles size={17} className="mb-3 text-brand"/>
      <p className="dashboard-title text-sm leading-6 text-[#46572d]">Wellness grows through every thoughtful conversation.</p>
    </div>
  </aside>
</> }
