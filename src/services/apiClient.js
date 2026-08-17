import axios from 'axios'

export const ACCESS_TOKEN_KEY = 'sales_access_token'

const configuredBaseUrl = import.meta.env.VITE_SALES_API_BASE_URL?.replace(/\/+$/, '')

if (!configuredBaseUrl) {
  throw new Error('VITE_SALES_API_BASE_URL is required')
}

const allowedEndpoints = [
  ['post', /^\/sales\/auth\/login$/],
  ['post', /^\/sales\/customers$/],
  ['get', /^\/sales\/customers$/],
  ['get', /^\/sales\/customers\/[^/]+$/],
  ['patch', /^\/sales\/customers\/[^/]+$/],
  ['get', /^\/sales\/products$/],
  ['post', /^\/sales\/orders$/],
  ['get', /^\/sales\/orders$/],
  ['get', /^\/sales\/orders\/[^/]+$/],
  ['post', /^\/sales\/orders\/[^/]+\/payment-link$/],
  ['get', /^\/sales\/pay\/[^/]+$/],
  ['post', /^\/sales\/pay\/[^/]+\/create-payment$/],
  ['post', /^\/sales\/orders\/[^/]+\/send-sms$/],
  ['post', /^\/sales\/orders\/[^/]+\/send-whatsapp$/],
  ['post', /^\/sales\/orders\/[^/]+\/payments\/sync$/],
  ['get', /^\/sales\/payment-links$/],
  ['get', /^\/sales\/message-deliveries$/],
]

function isAllowedRequest(method, url) {
  const path = String(url || '').split('?')[0]
  return allowedEndpoints.some(([allowedMethod, pattern]) => allowedMethod === method?.toLowerCase() && pattern.test(path))
}

const apiClient = axios.create({
  baseURL: configuredBaseUrl,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(config => {
  if (!isAllowedRequest(config.method, config.url)) {
    return Promise.reject(new Error('This request is not supported'))
  }
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (!config.skipAuth && token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      window.dispatchEvent(new Event('sales:unauthorized'))
    }
    const responseData = error.response?.data || {}
    const envelope = responseData.error || {}
    const details = envelope.details || (Array.isArray(responseData.detail) ? responseData.detail : [])
    const fieldErrors = Object.fromEntries(details.map(detail => [
      detail.field || detail.loc?.filter(part => part !== 'body').join('.') || 'request',
      detail.message || detail.msg,
    ]))
    const message = envelope.message
      || (Array.isArray(responseData.detail) ? responseData.detail.map(detail => detail.msg).filter(Boolean).join(', ') : responseData.detail)
      || error.message
      || 'Unable to reach the sales service'
    return Promise.reject(Object.assign(new Error(message), {
      status: error.response?.status,
      code: envelope.code || 'UNKNOWN',
      fieldErrors,
      data: error.response?.data,
      cause: error,
    }))
  },
)

export default apiClient
