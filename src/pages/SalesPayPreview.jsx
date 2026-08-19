import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import CustomerPaymentPreview from '../components/sales/CustomerPaymentPreview'
import CustomerPaymentStatus from '../components/sales/CustomerPaymentStatus'

import {
  createPublicPayment,
  getPublicPayPageData,
  getPublicPaymentStatus,
  verifyPublicPayment,
} from '../services/salesApi'

import { DetailSkeleton } from '../components/sales/LoadingSkeleton'
import { loadRazorpayCheckout } from '../utils/razorpayCheckout'
import { canRetryPayment, resolvePaymentOutcome } from '../utils/paymentStatus'

/*
 * ============================================================
 * CUSTOMER PAYMENT PAGE
 * ============================================================
 *
 * Responsibilities, and nothing more:
 *
 *   1. POST /sales/pay/{token}/create-payment
 *   2. Open Razorpay Checkout with the EXACT fields the API returned
 *   3. POST /sales/pay/{token}/verify-payment with the 3 Razorpay values
 *   4. Read the backend response
 *   5. Navigate to the page the backend result implies
 *
 * This page NEVER sets payment_status, never PATCHes pending -> success and
 * never treats a closed Razorpay modal as a failure.
 */

const POLL_INTERVAL_MS = 6000
const MAX_POLL_ATTEMPTS = 20 // ~2 minutes

export default function SalesPayPreview() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  const pollTimerRef = useRef(null)
  const pollAttemptsRef = useRef(0)
  const dataRef = useRef(null)
  const mountedRef = useRef(true)

  dataRef.current = data

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  /*
   * Router state carried into the success / failure pages.
   */
  const resultState = useCallback(
    (message, extra = {}) => ({
      token,
      orderNumber: dataRef.current?.order_number,
      amount: dataRef.current?.grand_total,
      message,
      ...extra,
    }),
    [token],
  )

  const goToSuccess = useCallback(
    (message = 'Payment confirmed successfully.') => {
      stopPolling()
      navigate('/payment-success', { replace: true, state: resultState(message) })
    },
    [navigate, resultState, stopPolling],
  )

  const goToFailure = useCallback(
    (message, payload) => {
      stopPolling()
      navigate('/payment-failed', {
        replace: true,
        state: resultState(message, {
          // A failed attempt does not kill an active link.
          canRetry: payload ? canRetryPayment(payload) : true,
        }),
      })
    },
    [navigate, resultState, stopPolling],
  )

  /*
   * ============================================================
   * LOAD THE PUBLIC ORDER / PAY PAGE
   * ============================================================
   */
  useEffect(() => {
    let active = true

    const loadPaymentPage = async () => {
      try {
        const result = await getPublicPayPageData(token)
        if (!active) return
        setData(result)
      } catch (requestError) {
        if (!active) return
        setError(
          requestError.status === 404
            ? 'This payment link is no longer valid.'
            : requestError.message,
        )
      }
    }

    loadPaymentPage()

    return () => {
      active = false
    }
  }, [token])

  /*
   * ============================================================
   * STATUS POLLING (backend truth only)
   * ============================================================
   *
   * Runs ONLY after the backend has told us payment_status = pending.
   * It reads the backend; it never writes a status.
   */
  const startStatusPolling = useCallback(() => {
    if (pollTimerRef.current) return

    pollAttemptsRef.current = 0

    const tick = async () => {
      pollAttemptsRef.current += 1

      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        if (mountedRef.current) {
          setVerificationMessage(
            'Your payment is still being confirmed by the bank. You will receive a confirmation shortly — you do not need to pay again.',
          )
        }
        return
      }

      try {
        const status = await getPublicPaymentStatus(token)
        if (!mountedRef.current) return

        const outcome = resolvePaymentOutcome(status)

        if (outcome === 'success') {
          goToSuccess()
          return
        }

        if (outcome === 'failed') {
          goToFailure('The payment was not completed.', status)
          return
        }

        // Still pending. Keep waiting — this is NOT a failure.
        setVerificationMessage('Payment is being confirmed…')
      } catch (pollError) {
        // The status endpoint being unavailable is not a payment failure.
        // Stop polling quietly and leave the customer on the confirming state.
        if (
          pollError.status === 404 ||
          pollError.status === 405 ||
          pollError.status === 501 ||
          pollError.message === 'This request is not supported'
        ) {
          stopPolling()
          if (mountedRef.current) {
            setVerificationMessage(
              'Payment is being confirmed by Ayudravya. This page will not update automatically — please keep your payment reference safe.',
            )
          }
        }
        // Any other error (network blip, 5xx): silently retry on the next tick.
      }
    }

    pollTimerRef.current = window.setInterval(tick, POLL_INTERVAL_MS)
    tick()
  }, [goToFailure, goToSuccess, stopPolling, token])

  /*
   * ============================================================
   * PAY NOW
   * ============================================================
   */
  async function pay() {
    if (paying) return

    setPaying(true)
    setError('')
    setVerificationMessage('Loading secure Razorpay Checkout…')

    try {
      const Razorpay = await loadRazorpayCheckout()

      /*
       * Backend creates the Razorpay Order. Every value below comes from
       * this response — nothing is hardcoded.
       *
       * PaymentResponse:
       *   key_id
       *   provider_order_id        <- Razorpay order_id
       *   amount_paise             <- Razorpay amount (integer, paise)
       *   currency
       *   checkout_timeout_seconds <- 600 (10 min Checkout session)
       *   expires_at
       */
      const payment = await createPublicPayment(token)

      const razorpayOrderId = payment.provider_order_id
      const razorpayAmount = payment.amount_paise

      if (!payment.key_id || !razorpayOrderId) {
        throw new Error('The payment provider is not configured')
      }

      let submitted = false

      const checkout = new Razorpay({
        key: payment.key_id,
        order_id: razorpayOrderId,
        amount: razorpayAmount,
        currency: payment.currency || 'INR',

        name: 'Ayudravya',
        description: `Payment for order ${data.order_number}`,

        prefill: {
          name: data.customer_name || '',
          email: data.customer_email || '',
          contact: data.customer_phone || '',
        },

        theme: { color: '#66853d' },
        retry: { enabled: true },

        /*
         * 600 seconds = the Razorpay Checkout session.
         * NOT the 48-hour unopened share-link lifetime.
         */
        timeout: payment.checkout_timeout_seconds,

        /*
         * Closing the Checkout modal is NOT a payment failure.
         * Nothing is written to the backend here.
         */
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (submitted) return
            setPaying(false)
            setVerificationMessage(
              'Payment window closed. No payment status was changed — you can try again.',
            )
          },
        },

        /*
         * RAZORPAY SUCCESS CALLBACK
         * Never navigates to success on its own.
         */
        handler: async razorpayResponse => {
          submitted = true
          setPaying(false)
          setError('')
          setPaymentProcessing(true)
          setVerificationMessage('Payment submitted. Verifying payment securely…')

          try {
            const verification = await verifyPublicPayment(token, {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            })

            /*
             * PublicVerifyPaymentResponse:
             *   order_id, payment_status, order_status, verified
             */
            const outcome = resolvePaymentOutcome(verification)

            if (outcome === 'success') {
              goToSuccess()
              return
            }

            if (outcome === 'failed') {
              goToFailure('The payment was not completed.', verification)
              return
            }

            /*
             * pending / verified:false
             * Razorpay authenticated the flow but the provider payment is not
             * confirmed as CAPTURED yet. DO NOT show failure.
             */
            setVerificationMessage('Payment is being confirmed…')
            startStatusPolling()
          } catch (verificationError) {
            /*
             * Verification failure is NOT allowed to become success.
             */
            console.error('VERIFY PAYMENT API ERROR:', verificationError)
            goToFailure(
              verificationError?.message || 'We could not verify this payment.',
            )
          }
        },
      })

      /*
       * Actual Razorpay payment failure.
       */
      checkout.on('payment.failed', response => {
        submitted = true
        setPaying(false)
        goToFailure(
          response?.error?.description ||
            'The payment was not completed. You can try again.',
        )
      })

      setVerificationMessage(
        'Razorpay Checkout is open. Complete payment in the secure window.',
      )

      checkout.open()
    } catch (requestError) {
      setError(
        requestError.code === 'PAYMENTS_NOT_CONFIGURED'
          ? 'Payments are not configured yet.'
          : requestError.message,
      )
      setVerificationMessage('')
      setPaying(false)
    }
  }

  return (
    <main className="dashboard-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"
          >
            {error}
          </div>
        )}

        {!data && !error && <DetailSkeleton message="Loading your secure order…" />}

        {/* Backend said pending — confirming, never failure. */}
        {data && paymentProcessing && (
          <CustomerPaymentStatus
            state="verifying"
            orderNumber={data.order_number}
            amount={data.grand_total}
            message={verificationMessage || 'Payment is being confirmed…'}
          />
        )}

        {data && !paymentProcessing && (
          <CustomerPaymentPreview data={data} onPay={pay} paying={paying} />
        )}

        {data && !paymentProcessing && verificationMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-xl bg-[#edf2ef] p-3 text-xs font-semibold text-brand"
          >
            {verificationMessage}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted">
          <ShieldCheck size={13} />
          Order details loaded securely
        </div>
      </div>
    </main>
  )
}
         