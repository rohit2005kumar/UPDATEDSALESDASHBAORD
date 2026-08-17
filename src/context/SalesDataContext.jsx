/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  createPaymentLink,
  createSalesCustomer,
  createSalesOrder,
  getSalesCustomers,
  getSalesMessageDeliveries,
  getSalesOrders,
  getSalesPaymentLinks,
  getSalesProducts,
  sendPaymentSms,
  sendPaymentWhatsapp,
  syncSalesOrderPayment,
  updateSalesCustomer,
} from '../services/salesApi'

const SalesDataContext = createContext(null)
const emptyData = {
  customers: [],
  orders: [],
  products: [],
  deliveries: [],
  paymentLinks: [],
}

const formatDate = value => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'

const mapOrder = order => ({
  id: order.id,
  orderNumber: order.order_number,
  customer: order.customer_name || 'Owned customer',
  phone: order.customer_phone || '—',
  source: 'Assisted call',
  amount: order.grand_total || '0.00',
  payment: order.payment_status,
  status: order.status,
  message: '—',
  createdAt: order.created_at,
  created: formatDate(order.created_at),
})

const mapDelivery = result => ({
  id: result.id,
  order: result.order_number || result.order_id,
  channel: result.channel,
  provider: result.provider,
  recipient: result.recipient_phone || 'Customer',
  status: result.message_status,
  errorMessage: result.error_message,
  sent: formatDate(result.created_at),
  updated: formatDate(result.updated_at || result.created_at),
})

const mapPaymentLink = link => {
  const path = link.pay_path || link.payment_url || link.url
  return {
    id: link.id,
    order: link.order_number || link.order_id,
    orderId: link.order_id,
    customer: link.customer_name,
    amount: link.amount,
    status: link.link_status,
    paymentStatus: link.payment_status,
    sentChannels: link.sent_channels || [],
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    usedAt: link.used_at,
    url: path ? new URL(path, window.location.origin).toString() : '',
  }
}

export function SalesDataProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(emptyData)
      return
    }

    setLoading(true)
    setApiError('')

    try {
      const [customerResult, orderResult, productResult, paymentLinkResult, deliveryResult] = await Promise.all([
        getSalesCustomers({ page: 1, limit: 100 }),
        getSalesOrders({ page: 1, limit: 100 }),
        getSalesProducts(),
        getSalesPaymentLinks({ page: 1, limit: 100 }),
        getSalesMessageDeliveries({ page: 1, limit: 100 }),
      ])

      setData(current => ({
        ...current,
        customers: customerResult.items || [],
        orders: (orderResult.items || []).map(mapOrder),
        products: productResult.items || [],
        paymentLinks: (paymentLinkResult.items || []).map(mapPaymentLink),
        deliveries: (deliveryResult.items || []).map(mapDelivery),
      }))
    } catch (error) {
      setData(emptyData)
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const addCustomer = async form => {
    const customer = await createSalesCustomer({
      full_name: form.full_name,
      phone: form.phone.replace(/\s/g, ''),
      email: form.email.trim().toLowerCase(),
      line1: form.address_line1,
      city: form.city,
      state: form.state,
      pincode: form.postal_code,
    })
    setData(current => ({ ...current, customers: [customer, ...current.customers] }))
    return customer
  }

  const addOrder = async payload => {
    const order = await createSalesOrder(payload)
    setData(current => ({ ...current, orders: [mapOrder(order), ...current.orders] }))
    return order
  }

  const updateCustomer = async (customerId, payload) => {
    const customer = await updateSalesCustomer(customerId, payload)
    setData(current => ({ ...current, customers: current.customers.map(item => item.id === customerId ? { ...item, ...customer } : item) }))
    return customer
  }

  const addPaymentLink = async orderId => {
    const paymentLink = await createPaymentLink(orderId)
    const url = new URL(paymentLink.pay_path, window.location.origin).toString()
    const row = {
      order: paymentLink.order_id,
      orderId: paymentLink.order_id,
      url,
      status: 'Active',
      expiresAt: paymentLink.expires_at,
    }

    setData(current => {
      const paymentLinks = [
        row,
        ...current.paymentLinks.filter(link => link.orderId !== row.orderId),
      ]
      return { ...current, paymentLinks }
    })

    return { ...paymentLink, url }
  }


  const syncPayment = async orderId => {
    const result = await syncSalesOrderPayment(orderId)
    setData(current => ({ ...current, orders: current.orders.map(order => order.id === orderId ? {
      ...order,
      payment: result.payment_status,
      status: result.order_status,
    } : order) }))
    return result
  }

  const sendDelivery = async (orderId, channel) => {
    const result = channel === 'WhatsApp'
      ? await sendPaymentWhatsapp(orderId)
      : await sendPaymentSms(orderId)
    const delivery = mapDelivery(result)
    setData(current => ({ ...current, deliveries: [delivery, ...current.deliveries] }))
    return delivery
  }

  return <SalesDataContext.Provider value={{
    ...data,
    loading,
    apiError,
    refresh,
    addCustomer,
    addOrder,
    updateCustomer,
    addPaymentLink,
    sendDelivery,
    syncPayment,
  }}>
    {children}
  </SalesDataContext.Provider>
}

export function useSalesData() {
  const value = useContext(SalesDataContext)
  if (!value) throw new Error('SalesDataProvider is missing')
  return value
}
