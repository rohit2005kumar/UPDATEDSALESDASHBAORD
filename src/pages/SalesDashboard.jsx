import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, UserCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SalesSidebar from '../components/sales/SalesSidebar'
import SalesTopbar from '../components/sales/SalesTopbar'
import SalesStatsCards from '../components/sales/SalesStatsCards'
import CustomerForm from '../components/sales/CustomerForm'
import { validateCustomerForm } from '../utils/customerValidation'
import ProductPicker from '../components/sales/ProductPicker'
import OrderSummary from '../components/sales/OrderSummary'
import PaymentLinkPanel from '../components/sales/PaymentLinkPanel'
import MessageDeliveryTable from '../components/sales/MessageDeliveryTable'
import RecentSalesOrders from '../components/sales/RecentSalesOrders'
import { useSalesData } from '../context/SalesDataContext'
import { getSalesCustomerById, getSalesOrderById } from '../services/salesApi'
import { DashboardSkeleton } from '../components/sales/LoadingSkeleton'

const steps = [
    { title: 'Customer Details', eyebrow: 'Customer' },
    { title: 'Select Products', eyebrow: 'Products' },
    { title: 'Review Order', eyebrow: 'Review' },
    { title: 'Payment Link', eyebrow: 'Payment' },
]

const normalizedStatus = value => String(value || '').trim().toLowerCase()

function paymentLinkState(link, url) {
    const status = normalizedStatus(link?.link_status || link?.status || (url ? 'active' : ''))
    const paymentStatus = normalizedStatus(link?.payment_status || link?.paymentStatus || 'pending')
    const expiresAt = link?.expires_at || link?.expiresAt
    const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN
    const isPaid = paymentStatus === 'paid'
    const isExpired = status === 'expired' || (!Number.isNaN(expiry) && expiry <= Date.now())
    const isRevoked = ['revoked', 'cancelled', 'canceled', 'inactive'].includes(status)
    const isActive = !isPaid && !isExpired && !isRevoked && status === 'active'
    const canSend = isActive && Boolean(url)
    return { status: isPaid ? 'paid' : isExpired ? 'expired' : isRevoked ? 'revoked' : isActive ? 'active' : status || 'none', paymentStatus, expiresAt, isPaid, isActive, canSend }
}

export default function SalesDashboard() {
    const { products, orders, deliveries, paymentLinks, loading, apiError, addCustomer, addOrder, addPaymentLink, sendDelivery } = useSalesData()
    const [menu, setMenu] = useState(false)
    const [activeStep, setActiveStep] = useState(0)
    const [form, setForm] = useState({})
    const [customerId, setCustomerId] = useState('')
    const [savedCustomer, setSavedCustomer] = useState(null)
    const [orderId, setOrderId] = useState('')
    const [createdOrder, setCreatedOrder] = useState(null)
    const [cart, setCart] = useState({})
    const [link, setLink] = useState('')
    const [toast, setToast] = useState('')
    const [lastStatus, setLastStatus] = useState('')
    const [loadingAction, setLoadingAction] = useState('')
    const [restoredPaymentLink, setRestoredPaymentLink] = useState(null)
    const busy = Boolean(loadingAction)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const selectedCustomerId = searchParams.get('customerId')
    const selectedOrderId = searchParams.get('orderId')
    const [checkingPaymentLink, setCheckingPaymentLink] = useState(Boolean(selectedOrderId))
    const listedPaymentLink = paymentLinks.find(item => item.orderId === selectedOrderId)
    const activePaymentLink = link || restoredPaymentLink?.url || listedPaymentLink?.url || ''
    const currentPaymentState = paymentLinkState(restoredPaymentLink || listedPaymentLink, activePaymentLink)
    const items = useMemo(
        () => products.filter(product => cart[product.id]).map(product => ({ ...product, quantity: cart[product.id] })),
        [cart, products],
    )
    const recentOrders = useMemo(
        () => [...orders]
            .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
            .slice(0, 5),
        [orders],
    )

    const notify = message => {
        setToast(message)
        setTimeout(() => setToast(''), 2400)
    }

    useEffect(() => {
        if (!selectedCustomerId) return
        let active = true

        const customerRequest = getSalesCustomerById(selectedCustomerId)
        const orderRequest = selectedOrderId ? getSalesOrderById(selectedOrderId) : Promise.resolve(null)

        Promise.all([customerRequest, orderRequest]).then(([customer, order]) => {
            if (!active) return
            if (order?.customer_id && order.customer_id !== customer.id) {
                throw Object.assign(new Error('The selected order does not belong to this customer.'), { code: 'ORDER_CUSTOMER_MISMATCH' })
            }
            setCustomerId(customer.id)
            setSavedCustomer(customer)
            setForm({
                full_name: customer.full_name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address_line1: customer.line1 || customer.address_line1 || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.pincode || customer.postal_code || '',
            })
            if (order) {
                setOrderId(order.id)
                setCreatedOrder(order)
                setCart(Object.fromEntries((order.items || []).map(item => [item.product_id, item.quantity])))
                setActiveStep(3)
                setCheckingPaymentLink(false)
            } else {
                setActiveStep(1)
                notify('Saved customer selected')
            }
        }).catch(error => {
            if (!active) return
            if (selectedOrderId) {
                navigate(`/sales-dashboard/create-order?customerId=${encodeURIComponent(selectedCustomerId)}`, { replace: true })
                notify(error.status === 404 ? 'The saved order could not be restored.' : error.message)
            } else {
                navigate('/sales-dashboard/customers', {
                    replace: true,
                    state: { customerSelectionError: error.status === 404 ? 'The selected customer could not be found.' : error.message },
                })
            }
        })

        return () => { active = false }
    }, [selectedCustomerId, selectedOrderId, navigate])

    async function save(customerForm = form) {
        if (customerId && savedCustomer) {
            setActiveStep(1)
            return
        }
        const validation = validateCustomerForm(customerForm)
        if (!validation.isValid) return notify(Object.values(validation.errors)[0])
        const validForm = validation.value
        setLoadingAction('customer')
        try {
            const customer = await addCustomer(validForm)
            setForm(validForm)
            setCustomerId(customer.id)
            setSavedCustomer({ ...validForm, ...customer })
            setActiveStep(1)
            notify('Customer saved')
        } catch (error) {
            notify(error.message)
        } finally {
            setLoadingAction('')
        }
    }

    function changeCustomer() {
        setCustomerId('')
        setSavedCustomer(null)
        setForm({})
        setCart({})
        setOrderId('')
        setCreatedOrder(null)
        setLink('')
        setLastStatus('')
        setActiveStep(0)
        navigate('/sales-dashboard/create-order', { replace: true })
        notify('Ready for a different customer')
    }

    async function createOrder() {
        if (!customerId) return notify('Save the customer first')
        if (!items.length) return notify('Add at least one product first')
        if (createdOrder && orderId) {
            setActiveStep(3)
            return
        }

        setLoadingAction('order')
        try {
            const order = await addOrder({
                customer_id: customerId,
                items: items.map(item => ({ product_id: item.id, quantity: item.quantity })),
            })
            setOrderId(order.id)
            setCreatedOrder(order)
            setActiveStep(3)
            navigate(`/sales-dashboard/create-order?customerId=${encodeURIComponent(customerId)}&orderId=${encodeURIComponent(order.id)}`, { replace: true })
            notify('Order created successfully')
        } catch (error) {
            notify(error.message)
        } finally {
            setLoadingAction('')
        }
    }

    async function generatePaymentLink() {
        if (!orderId) return notify('Create the order first')
        if (currentPaymentState.isPaid) return notify('This order is already paid')
        if (currentPaymentState.isActive) return notify('An active payment link already exists')
        setLoadingAction('payment-link')
        try {
            const paymentLink = await addPaymentLink(orderId)
            setRestoredPaymentLink(paymentLink)
            setLink(paymentLink.url)
            notify('Payment link created')
        } catch (error) {
            notify(error.message)
        } finally {
            setLoadingAction('')
        }
    }

    async function send(channel) {
        if (!orderId) return notify('Generate a payment link first')
        if (!currentPaymentState.canSend) return notify(currentPaymentState.isActive ? 'The backend did not return the active payment URL' : 'Generate an active payment link first')
        setLoadingAction(channel)
        try {
            const delivery = await sendDelivery(orderId, channel)
            setLastStatus(`${channel} · ${delivery.status}`)
            notify(delivery.status === 'failed' ? (delivery.errorMessage || `${channel} delivery failed`) : `${channel} delivery requested`)
        } catch (error) {
            notify(error.code === 'MESSAGING_NOT_CONFIGURED' ? 'Messaging provider is not configured yet.' : error.message)
        } finally {
            setLoadingAction('')
        }
    }

    return <div className="dashboard-shell min-h-screen">
        <SalesSidebar open={menu} setOpen={setMenu} />
        <div className="lg:pl-64">
            <SalesTopbar />
            <main className="dashboard-main mx-auto max-w-[1700px] space-y-5">
                {apiError && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{apiError}</div>}
                {loading ? <DashboardSkeleton message="Loading customers, orders, and products…" /> : <>
                <SalesStatsCards />

                <section className="dashboard-card overflow-hidden">
                    <div className="border-b border-line p-5 lg:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-brand">Step {activeStep + 1} of {steps.length}</p>
                                <h2 className="dashboard-title mt-1 text-lg">Create Assisted Order</h2>
                                <p className="mt-1 text-[10px] text-muted">Complete each step to safely create and share the customer’s payment link.</p>
                            </div>
                            <div className="shrink-0 dashboard-title text-sm text-brand">{Math.round(((activeStep + 1) / steps.length) * 100)}%</div>
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {steps.map((step, index) => {
                                const completed = index < activeStep
                                const active = index === activeStep
                                return <div key={step.title} className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition ${active ? 'border-brand bg-brand text-white shadow-sm' : completed ? 'border-[#dbe2cf] bg-[#eef2e7] text-brand' : 'border-line bg-[#faf9f5] text-muted'}`}>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">{step.eyebrow}</div>
                                        <div className="mt-0.5 truncate text-xs font-bold">{step.title}</div>
                                    </div>
                                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-bold ${active ? 'bg-white/20' : completed ? 'bg-brand text-white' : 'bg-white'}`}>{completed ? <Check size={12}/> : index + 1}</span>
                                </div>
                            })}
                        </div>

                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ebe8df]">
                            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} />
                        </div>
                    </div>

                    <fieldset disabled={busy} className="mx-auto min-h-[390px] max-w-4xl p-4 sm:p-5 lg:p-8">
                        <div className="mb-7 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-brand">{steps[activeStep].eyebrow}</p>
                            <h3 className="dashboard-title mt-2 text-xl">{steps[activeStep].title}</h3>
                            <p className="mx-auto mt-2 max-w-lg text-xs text-muted">
                                {activeStep === 0 && 'Add and save the customer details before choosing products.'}
                                {activeStep === 1 && 'Choose at least one available product and set its quantity.'}
                                {activeStep === 2 && 'Confirm the selected products before creating the order.'}
                                {activeStep === 3 && 'Generate, copy, or send the secure payment link to the customer.'}
                            </p>
                        </div>

                        {activeStep === 0 && (savedCustomer
                            ? <SavedCustomerCard
                                customer={savedCustomer}
                                onContinue={() => setActiveStep(1)}
                                onChange={changeCustomer}
                            />
                            : <CustomerForm form={form} setForm={setForm} onSave={save} saving={loadingAction === 'customer'} />)}

                        {activeStep === 1 && <>
                            <ProductPicker products={products} cart={cart} setQty={(id, quantity) => setCart(current => ({ ...current, [id]: quantity }))} />
                            <WizardActions
                                onBack={() => setActiveStep(0)}
                                onNext={() => items.length ? setActiveStep(2) : notify('Select at least one product to continue')}
                                nextLabel="Review order"
                                nextDisabled={!items.length}
                            />
                        </>}

                        {activeStep === 2 && <>
                            <OrderSummary items={items} order={createdOrder} />
                            <WizardActions
                                onBack={createdOrder ? undefined : () => setActiveStep(1)}
                                onNext={createOrder}
                                nextLabel={loadingAction === 'order' ? 'Creating order…' : (createdOrder ? 'Continue to payment' : 'Create order')}
                                nextDisabled={busy}
                            />
                        </>}

                        {activeStep === 3 && <>
                            <PaymentLinkPanel
                                link={activePaymentLink}
                                onGenerate={generatePaymentLink}
                                onSend={send}
                                onCopy={() => {
                                    navigator.clipboard?.writeText(activePaymentLink)
                                    notify('Link copied')
                                }}
                                lastStatus={lastStatus}
                                loadingAction={loadingAction}
                                checking={checkingPaymentLink}
                                linkStatus={currentPaymentState.status}
                                paymentStatus={currentPaymentState.paymentStatus}
                                expiresAt={currentPaymentState.expiresAt}
                                active={currentPaymentState.isActive}
                                sendable={currentPaymentState.canSend}
                                paid={currentPaymentState.isPaid}
                            />
                            <WizardActions onBack={() => setActiveStep(2)} />
                        </>}
                    </fieldset>
                </section>

                {activeStep === 3 && <MessageDeliveryTable rows={deliveries} />}
                <RecentSalesOrders orders={recentOrders} />
                <div className="botanical-divider" />
                <p className="dashboard-title pb-2 text-center text-xs italic text-muted">Every order is a step toward trusted wellness.</p>
                </>}
            </main>
        </div>
        {toast && <div role="status" className="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white shadow-xl sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm">{toast}</div>}
    </div>
}

function SavedCustomerCard({ customer, onContinue, onChange }) {
    return <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-[#dbe2cf] bg-[#f7f9f3] p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white"><UserCheck size={20}/></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="dashboard-title text-lg">{customer.full_name || 'Saved customer'}</h4>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf0e4] px-2.5 py-1 text-[9px] font-bold text-brand"><span className="size-1.5 rounded-full bg-brand"/>Saved</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{customer.phone || 'No phone number'}</p>
                    {customer.email && <p className="mt-1 break-all text-[10px] text-muted">{customer.email}</p>}
                    <p className="mt-4 text-[10px] leading-5 text-muted">This customer is already saved and selected for the order. Continuing will reuse the existing customer ID and will not create another customer record.</p>
                </div>
            </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onChange} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:border-brand hover:text-brand"><RotateCcw size={14}/>Change customer</button>
            <button type="button" onClick={onContinue} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-dark">Continue with this customer<ArrowRight size={14}/></button>
        </div>
    </div>
}

function WizardActions({ onBack, onNext, nextLabel, nextDisabled = false }) {
    return <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        {onBack
            ? <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:border-brand hover:text-brand"><ArrowLeft size={14}/>Back</button>
            : <span />}
        {onNext && <button type="button" onClick={onNext} disabled={nextDisabled} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">{nextLabel}<ArrowRight size={14}/></button>}
    </div>
}
