import StatusBadge from './StatusBadge'
const headers = ['Attempt ID', 'Order ID', 'Channel', 'Provider', 'Recipient', 'Status', 'Sent At', 'Updated At']
export default function MessageDeliveryTable({ rows }) {
    return <div className="dashboard-card overflow-hidden">
        <div className="border-b border-line p-4"><h3 className="dashboard-title text-sm">Message deliveries</h3>
            <p className="mt-1 text-[9px] text-muted">Delivery attempts from the configured messaging provider.</p>
        </div><div className="dashboard-table-scroll"><table className="w-full min-w-[850px] text-left text-[10px]">
            <thead className="bg-[#faf9f5] text-muted"><tr>{headers.map(h => <th key={h} className="px-4 py-3 font-semibold">
                {h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-3 font-bold">{r.id}</td><td className="px-4 py-3">{r.order}</td>
                    <td className="px-4 py-3 font-semibold">{r.channel}</td><td className="px-4 py-3">{r.provider}</td>
                    <td className="px-4 py-3">{r.recipient}</td><td className="px-4 py-3"><StatusBadge>{r.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">{r.sent}</td><td className="px-4 py-3">{r.updated}</td>
                    </tr>)}
            </tbody>
        </table>
        </div>
    </div>
}
