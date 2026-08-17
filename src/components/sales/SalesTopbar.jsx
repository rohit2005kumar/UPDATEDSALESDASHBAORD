import { Bell, ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
export default function SalesTopbar() {
  const { user, logout } = useAuth(), navigate = useNavigate()

  const signOut = () => { logout(); navigate('/', { replace: true }) }
  return <header className="sticky top-0 z-20 flex min-h-20 items-center gap-2 border-b border-line bg-[#fffefa]/95 px-3 backdrop-blur sm:gap-4 sm:px-5 lg:px-8">
    <div className="ml-11 min-w-0 lg:ml-0">
      <h1 className="text-base font-extrabold">Sales Team Dashboard</h1>
      <p className="mt-0.5 text-[10px] text-muted">Here is your sales overview · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</p>
    </div>
    <button className="relative ml-auto shrink-0 rounded-full border border-line bg-white p-2.5" aria-label="Notifications"><Bell size={16} />
      <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" /></button>
    <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#dfe4d3] bg-brand text-xs font-bold text-white">{user.initials}</div>
    <div className="hidden xl:block"><div className="text-xs font-bold">{user.name}</div><div className="text-[10px] text-muted">{user.role}</div>
    </div>
    <button onClick={signOut} className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold text-muted hover:bg-stone-50" aria-label="Log out">
      <LogOut size={15} /><span className="hidden sm:inline">Logout</span><ChevronDown size={13} className="hidden xl:block"/>
    </button>
  </header>
}
