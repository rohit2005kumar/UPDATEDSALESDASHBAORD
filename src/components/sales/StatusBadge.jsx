const styles = {
    paid: 'bg-emerald-50 text-emerald-700',
    success: 'bg-emerald-50 text-emerald-700',
    confirmed: 'bg-emerald-50 text-emerald-700', delivered: 'bg-emerald-50 text-emerald-700',
    read: 'bg-violet-50 text-violet-700', pending: 'bg-amber-50 text-amber-700', 'awaiting payment': 'bg-amber-50 text-amber-700',
    queued: 'bg-amber-50 text-amber-700', sent: 'bg-blue-50 text-blue-700',
    active: 'bg-emerald-50 text-emerald-700',
    processing: 'bg-blue-50 text-blue-700', failed: 'bg-red-50 text-red-700'
}
export default function StatusBadge({ children }) {
    return <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[String(children).toLowerCase()] || 'bg-stone-100 text-stone-600'}`}>
        {children}
    </span>
}
