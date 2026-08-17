import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import { money } from './OrderSummary'

const statusContent = {
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-700', label: 'Payment successful', title: 'Your payment is confirmed', message: 'Thank you. Your order has been confirmed and will be processed shortly.' },
  failed: { icon: XCircle, iconClass: 'bg-red-50 text-red-600', label: 'Payment failed', title: 'Your payment was not completed', message: 'No payment was confirmed for this order. You can safely try again.' },
  verifying: { icon: RefreshCw, iconClass: 'bg-amber-50 text-amber-700', label: 'Verifying payment', title: 'We are confirming your payment', message: 'Please keep this page open while we securely verify the result with Razorpay.' },
  expired: { icon: Clock3, iconClass: 'bg-stone-100 text-stone-600', label: 'Payment link expired', title: 'This payment link has expired', message: 'Please contact Ayudravya to receive a new payment link.' },
}

export default function CustomerPaymentStatus({ state, orderNumber, amount, message, onRetry, retrying = false }) {
  const content = statusContent[state] || statusContent.verifying
  const Icon = content.icon

  return <section className="dashboard-card overflow-hidden text-center">
    <div className="border-b border-line bg-[#fffefa] p-5">
      <img src="/ayudravya-logo.png" alt="Ayudravya" className="mx-auto size-14 object-contain mix-blend-multiply" />
      <p className="dashboard-title mt-2 text-lg text-[#705019]">Ayudravya</p>
    </div>
    <div className="p-6 sm:p-8">
      <span className={`mx-auto grid size-16 place-items-center rounded-full ${content.iconClass}`}><Icon size={32} className={state === 'verifying' ? 'animate-spin' : ''} /></span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted">{content.label}</p>
      <h1 className="dashboard-title mt-2 text-2xl text-ink">{content.title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-muted">{message || content.message}</p>
      {orderNumber && <div className="mt-6 rounded-xl bg-stone-50 p-4 text-left text-xs">
        <div className="flex justify-between gap-3"><span className="text-muted">Order</span><b className="text-right">{orderNumber}</b></div>
        {amount != null && <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Amount</span><b>{money(amount)}</b></div>}
      </div>}
      {state === 'failed' && onRetry && <button type="button" onClick={onRetry} disabled={retrying} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"><RefreshCw size={15} />{retrying ? 'Opening secure checkout…' : 'Try payment again'}</button>}
      {state === 'success' && <p className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold text-brand"><ShieldCheck size={14} />Securely verified by Ayudravya</p>}
    </div>
  </section>
}
