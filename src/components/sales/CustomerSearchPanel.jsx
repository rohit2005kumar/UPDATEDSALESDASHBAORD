import { Search } from 'lucide-react'
export default function CustomerSearchPanel({ customers = [] }) {
  return <section className="dashboard-card p-4">
    <label className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
      <Search size={14}/>
      <input className="w-full bg-transparent text-xs outline-none" placeholder="Search saved customers"/>
      </label><p className="mt-3 text-xs font-bold">{customers.length} saved customers</p>
      </section>
}
