import { CircleCheck, Clock3, Link2, MessageCircle, PackageCheck, Send } from 'lucide-react'
import { useSalesData } from '../../context/SalesDataContext'
export default function SalesStatsCards() {
    const { orders, deliveries, paymentLinks } = useSalesData(),
        paid = orders.filter(order => String(order.payment).toLowerCase() === 'success').length,
        pending = orders.length - paid,
        whatsapp = deliveries.filter(row => row.channel === 'WhatsApp' && ['delivered', 'read'].includes(row.status)).length,
        sms = deliveries.filter(row => row.channel === 'SMS' && ['delivered', 'sent', 'read'].includes(row.status)).length;
    const data = [[PackageCheck, "Assisted Orders", orders.length], [Link2, 'Payment Links', paymentLinks.length], [CircleCheck, 'Paid Orders', paid], [Clock3, 'Pending Payments', pending], [MessageCircle, 'WhatsApp Delivered', whatsapp], [Send, 'SMS Delivered', sms]];
    return <div className="grid gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {data.map(([Icon, label, value]) => <div key={label} className="dashboard-card flex min-h-24 items-center gap-3 p-4" onClick={()=>{console.log(orders)
            console.log("data from card",paid)
        }}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f0f3e9] text-brand"><Icon size={19} /></span>
            <div><div className="text-[10px] font-medium text-muted">{label}</div>
                <div className="dashboard-title mt-1 text-2xl">{value}</div></div>
        </div>)}
    </div>
}
