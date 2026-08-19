import { ShieldCheck } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import CustomerPaymentStatus from '../components/sales/CustomerPaymentStatus'

/*
 * PAYMENT SUCCESS PAGE
 *
 * This page is ONLY reachable after the Sales backend has answered
 * verify-payment (or the status poll) with payment_status = success.
 * It renders backend truth; it never sets or infers a payment status.
 */
export default function PaymentSuccess() {
  const { state } = useLocation()

  return (
    <main className="dashboard-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <CustomerPaymentStatus
          state="success"
          orderNumber={state?.orderNumber}
          amount={state?.amount}
          message={state?.message}
        />

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted">
          <ShieldCheck size={13} />
          Confirmed by Ayudravya after Razorpay verification
        </div>
      </div>
    </main>
  )
}
