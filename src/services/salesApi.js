import apiClient from './apiClient'

const dataOf = request =>
  request.then(response => response.data)

// Single backend integration layer for the sales UI.
// No mock fallback is used.

export const createSalesCustomer = payload =>
  dataOf(
    apiClient.post(
      '/sales/customers',
      payload
    )
  )

export const getSalesCustomers = (params = {}) =>
  dataOf(
    apiClient.get(
      '/sales/customers',
      { params }
    )
  )

export const getSalesCustomerById = id =>
  dataOf(
    apiClient.get(
      `/sales/customers/${encodeURIComponent(id)}`
    )
  )

export const updateSalesCustomer = (
  id,
  payload
) =>
  dataOf(
    apiClient.patch(
      `/sales/customers/${encodeURIComponent(id)}`,
      payload
    )
  )

export const getSalesProducts = (params = {}) =>
  dataOf(
    apiClient.get(
      '/sales/products',
      { params }
    )
  )

export const createSalesOrder = payload =>
  dataOf(
    apiClient.post(
      '/sales/orders',
      payload
    )
  )

export const getSalesOrders = (params = {}) =>
  dataOf(
    apiClient.get(
      '/sales/orders',
      { params }
    )
  )

export const getSalesOrderById = id =>
  dataOf(
    apiClient.get(
      `/sales/orders/${encodeURIComponent(id)}`
    )
  )

export const createPaymentLink = orderId =>
  dataOf(
    apiClient.post(
      `/sales/orders/${encodeURIComponent(orderId)}/payment-link`
    )
  )

export const getPublicPayPageData = token =>
  dataOf(
    apiClient.get(
      `/sales/pay/${encodeURIComponent(token)}`,
      {
        skipAuth: true,
      }
    )
  )

export const createPublicPayment = token =>
  dataOf(
    apiClient.post(
      `/sales/pay/${encodeURIComponent(token)}/create-payment`,
      undefined,
      {
        skipAuth: true,
      }
    )
  )

/*
 * NEW BACKEND ENDPOINT
 *
 * POST:
 * /sales/pay/{token}/verify-payment
 */
export const verifyPublicPayment = (
  token,
  payload
) =>
  dataOf(
    apiClient.post(
      `/sales/pay/${encodeURIComponent(token)}/verify-payment`,
      payload,
      {
        skipAuth: true,
      }
    )
  )

/*
 * PUBLIC PAYMENT STATUS POLLING
 *
 * GET /sales/pay/{token}/status
 *
 * Used ONLY while the backend has answered verify-payment with
 * payment_status = "pending". The frontend never decides the status; it
 * simply re-reads whatever the backend/webhook has settled on.
 *
 * Expected response shape (see BACKEND_STATUS_ENDPOINT.md):
 * {
 *   "order_id": "uuid",
 *   "payment_status": null | "pending" | "failed" | "success",
 *   "order_status": "string",
 *   "link_status": "active" | "paid" | "expired" | "cancelled"
 * }
 */
export const getPublicPaymentStatus = token =>
  dataOf(
    apiClient.get(
      `/sales/pay/${encodeURIComponent(token)}/status`,
      {
        skipAuth: true,
      }
    )
  )

export const getSalesPaymentLinkById = id =>
  dataOf(
    apiClient.get(
      `/sales/payment-links/${encodeURIComponent(id)}`
    )
  )

export const sendPaymentSms = orderId =>
  dataOf(
    apiClient.post(
      `/sales/orders/${encodeURIComponent(orderId)}/send-sms`
    )
  )

export const sendPaymentWhatsapp = orderId =>
  dataOf(
    apiClient.post(
      `/sales/orders/${encodeURIComponent(orderId)}/send-whatsapp`
    )
  )

export const syncSalesOrderPayment = orderId =>
  dataOf(
    apiClient.post(
      `/sales/orders/${encodeURIComponent(orderId)}/payments/sync`
    )
  )

export const getSalesPaymentLinks = (
  params = {}
) =>
  dataOf(
    apiClient.get(
      '/sales/payment-links',
      { params }
    )
  )

export const getSalesMessageDeliveries = (
  params = {}
) =>
  dataOf(
    apiClient.get(
      '/sales/message-deliveries',
      { params }
    )
  )