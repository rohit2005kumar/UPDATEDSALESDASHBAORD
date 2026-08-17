const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let checkoutScriptPromise

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (checkoutScriptPromise) return checkoutScriptPromise

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${CHECKOUT_SCRIPT_URL}"]`)
    const script = existingScript || document.createElement('script')
    const loaded = () => window.Razorpay
      ? resolve(window.Razorpay)
      : reject(new Error('Razorpay Checkout could not be initialized'))
    const failed = () => {
      checkoutScriptPromise = undefined
      reject(new Error('Unable to load Razorpay Checkout. Check your connection and try again.'))
    }

    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', failed, { once: true })
    if (!existingScript) {
      script.src = CHECKOUT_SCRIPT_URL
      script.async = true
      document.body.appendChild(script)
    }
  })

  return checkoutScriptPromise
}
