import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'
import CustomerPaymentPreview from '../components/sales/CustomerPaymentPreview'
import CustomerPaymentStatus from '../components/sales/CustomerPaymentStatus'
import { createPublicPayment, getPublicPaymentStatus, getPublicPayPageData } from '../services/salesApi'
import { DetailSkeleton } from '../components/sales/LoadingSkeleton'
import { loadRazorpayCheckout } from '../utils/razorpayCheckout'

const POLL_INTERVAL_MS = 2500
const MAX_STATUS_POLLS = 18

const normalizePaymentState = value => {
  const status = String(value || '').trim().toLowerCase()
  if (['paid', 'success', 'captured', 'completed'].includes(status)) return 'success'
  if (['failed', 'failure'].includes(status)) return 'failed'
  if (['expired', 'cancelled', 'canceled'].includes(status)) return 'expired'
  return 'verifying'
}

const statusFromResponse = response => normalizePaymentState(
  response?.payment_status || response?.paymentStatus || response?.status || response?.link_status,
)

export default function SalesPayPreview() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentState, setPaymentState] = useState('review')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [statusChecks, setStatusChecks] = useState(0)

  const readPublicStatus = useCallback(async () => {
    const response = await getPublicPaymentStatus(token)
    const nextState = statusFromResponse(response)
    setPaymentState(nextState)
    if (response?.order_number || response?.grand_total) setData(current => ({ ...current, ...response }))
    return nextState
  }, [token])

  useEffect(() => {
    let active = true
    getPublicPayPageData(token).then(result => {
      if (!active) return
      setData(result)
      const initialState = statusFromResponse(result)
      if (initialState !== 'verifying') setPaymentState(initialState)
    }).catch(requestError => {
      if (active) setError(requestError.status === 404 ? 'This payment link is no longer valid.' : requestError.message)
    })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (paymentState !== 'verifying') return undefined
    let active = true
    let timer
    let attempts = 0

    const verify = async () => {
      try {
        const nextState = await readPublicStatus()
        if (!active || nextState !== 'verifying') return
        attempts += 1
        setStatusChecks(attempts)
        if (attempts >= MAX_STATUS_POLLS) {
          setVerificationMessage('Payment is still being verified. Please refresh this page in a moment; do not pay again unless the result says payment failed.')
          return
        }
        timer = window.setTimeout(verify, POLL_INTERVAL_MS)
      } catch (requestError) {
        if (!active) return
        if (requestError.status === 404) {
          setVerificationMessage('Your payment was submitted. We are waiting for secure confirmation from the payment provider.')
          return
        }
        timer = window.setTimeout(verify, POLL_INTERVAL_MS)
      }
    }

    verify()
    return () => { active = false; window.clearTimeout(timer) }
  }, [paymentState, readPublicStatus])

  async function pay() {
    if (paying) return
    setPaying(true)
    setError('')
    setVerificationMessage('Loading secure Razorpay Checkout…')
    try {
      const Razorpay = await loadRazorpayCheckout()
      const payment = await createPublicPayment(token)
      if (!payment.key_id || !payment.provider_order_id) throw new Error('The payment provider is not configured')

      let submitted = false
      const checkout = new Razorpay({
        key: payment.key_id,
        order_id: payment.provider_order_id,
        amount: payment.amount_paise,
        currency: payment.currency || 'INR',
        name: 'Ayudravya',
        description: `Payment for order ${data.order_number}`,
        image: `${window.location.origin}/ayudravya-logo.png`,
        prefill: { name: data.customer_name || '', email: data.customer_email || '', contact: data.customer_phone || '' },
        theme: { color: '#66853d' },
        retry: { enabled: true },
        timeout: payment.checkout_timeout_seconds,
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (!submitted) {
              setPaying(false)
              setVerificationMessage('Payment window closed. No payment status was changed.')
            }
          },
        },
        handler: () => {
          submitted = true
          setPaying(false)
          setStatusChecks(0)
          setVerificationMessage('Payment submitted. Verifying it securely with Razorpay…')
          setPaymentState('verifying')
        },
      })
      checkout.on('payment.failed', response => {
        submitted = true
        setPaying(false)
        setVerificationMessage(response.error?.description || 'The payment was not completed. You can try again safely.')
        setPaymentState('failed')
      })
      setVerificationMessage('Razorpay Checkout is open. Complete payment in the secure window.')
      checkout.open()
    } catch (requestError) {
      setError(requestError.code === 'PAYMENTS_NOT_CONFIGURED' ? 'Payments are not configured yet.' : requestError.message)
      setVerificationMessage('')
      setPaying(false)
    }
  }

  const resultState = paymentState === 'review' ? null : paymentState

  return <main className="dashboard-shell min-h-screen px-4 py-8">
    <div className="mx-auto max-w-md">
      {error && <div role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">{error}</div>}
      {!data && !error && <DetailSkeleton message="Loading your secure order…" />}
      {data && resultState && <CustomerPaymentStatus state={resultState} orderNumber={data.order_number} amount={data.grand_total} message={verificationMessage} onRetry={resultState === 'failed' ? pay : undefined} retrying={paying} />}
      {data && !resultState && <CustomerPaymentPreview data={data} onPay={pay} paying={paying} />}
      {data && !resultState && verificationMessage && <div role="status" aria-live="polite" className="mt-4 rounded-xl bg-[#edf2ef] p-3 text-xs font-semibold text-brand">{verificationMessage}</div>}
      {paymentState === 'verifying' && statusChecks > 0 && <p className="mt-3 text-center text-[10px] text-muted">Secure verification in progress…</p>}
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted"><ShieldCheck size={13} />Order details loaded securely</div>
    </div>
  </main>
}
