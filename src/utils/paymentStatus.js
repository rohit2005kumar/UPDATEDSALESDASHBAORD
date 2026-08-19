/*
 * PAYMENT STATUS NORMALISATION
 *
 * The frontend NEVER decides a payment status. These helpers only translate
 * whatever the backend returned (payment_status / link_status) into the three
 * UI outcomes the customer page can render:
 *
 *   'success'    -> navigate to /payment-success
 *   'failed'     -> navigate to /payment-failed
 *   'processing' -> stay on the page, show "Payment is being confirmed…"
 *
 * Anything unknown, null or empty is deliberately treated as 'processing'.
 * A missing status is NOT a failure.
 */

const SUCCESS = ['success', 'paid', 'captured', 'completed']
const FAILED = ['failed', 'failure']
const DEAD_LINK = ['expired', 'cancelled', 'canceled', 'revoked']

const clean = value => String(value ?? '').trim().toLowerCase()

export function isSuccessStatus(value) {
  return SUCCESS.includes(clean(value))
}

export function isFailedStatus(value) {
  return FAILED.includes(clean(value))
}

export function isDeadLinkStatus(value) {
  return DEAD_LINK.includes(clean(value))
}

/*
 * Resolve the customer-facing outcome from a backend payload that may carry
 * payment_status and/or link_status.
 */
export function resolvePaymentOutcome({ payment_status, link_status } = {}) {
  if (isSuccessStatus(payment_status) || isSuccessStatus(link_status)) {
    return 'success'
  }

  if (isFailedStatus(payment_status)) {
    return 'failed'
  }

  return 'processing'
}

/*
 * A failed attempt does NOT kill the payment link.
 * Retry is allowed whenever the backend still reports link_status = active.
 */
export function canRetryPayment({ payment_status, link_status } = {}) {
  if (isSuccessStatus(payment_status) || isSuccessStatus(link_status)) {
    return false
  }

  if (isDeadLinkStatus(link_status)) {
    return false
  }

  return clean(link_status) === 'active' || !link_status
}
