import { ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import CustomerPaymentStatus from '../components/sales/CustomerPaymentStatus'

/*
 * PAYMENT FAILURE PAGE
 *
 * A failed attempt does NOT necessarily mean the payment link is dead.
 * If the backend still reports link_status = active (passed through router
 * state as canRetry), the customer is offered "Try payment again", which
 * simply sends them back to /pay/{token} to start a fresh attempt.
 *
 * Nothing on this page writes a payment status anywhere.
 */
export default function PaymentFailed() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const token = state?.token
  const canRetry = state?.canRetry !== false && Boolean(token)

  return (
    <main className="dashboard-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <CustomerPaymentStatus
          state="failed"
          orderNumber={state?.orderNumber}
          amount={state?.amount}
          message={state?.message}
          onRetry={
            canRetry
              ? () => navigate(`/pay/${encodeURIComponent(token)}`, { replace: true })
              : undefined
          }
        />

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted">
          <ShieldCheck size={13} />
          No payment was captured for this order
        </div>
      </div>
    </main>
  )
}
