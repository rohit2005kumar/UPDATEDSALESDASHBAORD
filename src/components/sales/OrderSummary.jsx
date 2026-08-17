import { ReceiptText } from 'lucide-react'

// eslint-disable-next-line react-refresh/only-export-components
export const money = value => typeof value === 'string'
  ? `₹${value}`
  : `₹${Math.round(value).toLocaleString('en-IN')}`

export default function OrderSummary({ items, order }) {
  const estimate = items.reduce((sum, item) => sum + item.price * item.quantity, 300)
  return <section>
    <div className="mb-4 flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ef] text-brand"><ReceiptText size={15}/></span>
      <div><h3 className="dashboard-title text-sm">Review order total</h3><p className="text-[10px] text-muted">Final totals are calculated securely</p></div>
    </div>
    {order ? <>
      <div className="space-y-2">{order.items.map((item, index) => <div className="flex items-start justify-between gap-3 border-b border-line pb-2 text-[10px]" key={`${item.product_sku}-${index}`}><div className="min-w-0"><b className="break-words">{item.product_name}</b><div className="text-muted">{item.quantity} × {money(item.unit_price)}</div></div><b className="shrink-0">{money(item.subtotal)}</b></div>)}</div>
      <div className="mt-4 space-y-2 rounded-xl bg-stone-50 p-3 text-[11px]">
        <div className="flex justify-between"><span>Subtotal</span><b>{money(order.subtotal)}</b></div>
        <div className="flex justify-between"><span>Discount</span><b>{money(order.discount_total)}</b></div>
        <div className="flex justify-between"><span>Shipping</span><b>{money(order.shipping_total)}</b></div>
        <div className="flex justify-between"><span>GST {order.gst_rate}%</span><b>{order.gst_amount}</b></div>
        <div className="flex justify-between border-t border-line pt-2 text-sm"><b>Grand Total</b><b>{money(order.grand_total)}</b></div>
      </div>
    </> : <>
      {items.length ? <div className="space-y-2">
        {items.map(item => <div className="flex items-start justify-between gap-3 border-b border-line pb-2 text-[10px]" key={item.id}>
          <div className="min-w-0"><b className="break-words">{item.name}</b><div className="text-muted">Quantity {item.quantity}</div></div></div>)}</div> : <div className="rounded-xl border border-dashed border-line py-8 text-center text-[11px] text-muted">Add products to build the order</div>}
      {items.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800"><div className="flex justify-between"><span>Estimated total</span><b>{money(estimate)}</b></div><p className="mt-2 text-[9px]">The confirmed payable amount will appear after order creation.</p></div>}
    </>}
  </section>
}
