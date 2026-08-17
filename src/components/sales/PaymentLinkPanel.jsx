import { Copy, Link2, MessageCircle, Send } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function PaymentLinkPanel({ link, onGenerate, onSend, onCopy, lastStatus, loadingAction, checking, linkStatus, paymentStatus, expiresAt, active, sendable, paid }) {
    const generateLabel = checking
        ? 'Checking existing payment link…'
        : loadingAction === 'payment-link'
            ? 'Generating secure payment link…'
            : paid
                ? 'Order already paid'
                : active
                    ? 'Active payment link already exists'
                    : 'Generate Payment Link'

    return <section>
        <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ef] text-brand"><Link2 size={15}/></span>
            <div><h3 className="dashboard-title text-sm">Payment link & delivery</h3><p className="text-[10px] text-muted">Generate, then send automatically</p></div>
        </div>
        <button onClick={onGenerate} disabled={checking || Boolean(loadingAction) || active || paid} className="w-full rounded-lg bg-brand px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{generateLabel}</button>
        {link && <div className="mt-3 rounded-xl bg-stone-50 p-3">
            <div className="mb-2 flex justify-between"><b className="text-[10px]">Secure payment link</b><StatusBadge>{linkStatus || 'Active'}</StatusBadge></div>
            <div className="truncate text-[10px] text-muted">{link}</div>
            {expiresAt && <div className="mt-2 text-[9px] text-muted">Expires {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(expiresAt))}</div>}
        </div>}
        {active && !link && !checking && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">An active payment link exists, but the backend did not return its secure URL. Generation remains disabled to protect the link already sent to the customer.</p>}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button disabled={!sendable || checking || Boolean(loadingAction)} onClick={() => onSend('SMS')} className="flex items-center justify-center gap-2 rounded-xl bg-[#32736b] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Send size={14}/>{loadingAction === 'SMS' ? 'Sending SMS…' : 'Send Payment via SMS'}</button>
            <button disabled={!sendable || checking || Boolean(loadingAction)} onClick={() => onSend('WhatsApp')} className="flex items-center justify-center gap-2 rounded-xl bg-[#25a968] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"><MessageCircle size={14}/>{loadingAction === 'WhatsApp' ? 'Sending WhatsApp…' : 'Send via WhatsApp'}</button>
        </div>
        <button disabled={!sendable || checking} onClick={onCopy} className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-[10px] font-bold text-muted disabled:opacity-40"><Copy size={12}/>Copy link (manual backup)</button>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-line p-3 text-[10px]">
            <span className="text-muted">Order status</span><b>{paid ? 'Paid' : 'Awaiting payment'}</b>
            <span className="text-muted">Payment status</span><StatusBadge>{paymentStatus || 'Pending'}</StatusBadge>
            <span className="text-muted">Last delivery</span><b>{lastStatus || 'Not sent'}</b>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[9px] font-semibold text-amber-800">Razorpay webhook is the only source of payment truth.</p>
    </section>
}
