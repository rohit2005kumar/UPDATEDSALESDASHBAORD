import { Minus, Plus, ShoppingBag } from 'lucide-react'
export default function ProductPicker({ products, cart, setQty }) {
    return <section>
        <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ef] text-brand">
                <ShoppingBag size={15} />
            </span>
            <div><h3 className="dashboard-title text-sm">Select products</h3>
                <p className="text-[10px] text-muted">Available products · prices locked</p>
            </div>
        </div>{!products.length ? <div className="rounded-xl border border-dashed border-line p-5 text-center text-xs text-muted">No products are available right now. Add products to enable order creation.</div>
            :
            <div className="space-y-2.5">{products.map(p => {
                const qty = cart[p.id] || 0; return <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-[#fffefa] p-3 sm:flex-nowrap"><div className={`grid size-10 shrink-0 place-items-center rounded-xl font-black ${p.tone || 'bg-emerald-50 text-emerald-700'}`}>{p.name[0]}</div><div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{p.name}</div>
                    <div className="mt-1 text-[9px] text-muted">{p.sku} · GST {p.gst}% · {p.stock} in stock</div></div>
                    <div className="ml-auto text-right sm:ml-0"><div className="text-xs font-extrabold">₹{p.price.toLocaleString('en-IN')}</div>
                        <div className="mt-1 flex items-center rounded-lg border border-line"><button aria-label={`Decrease ${p.name}`} onClick={() => setQty(p.id, Math.max(0, qty - 1))} className="p-1.5"><Minus size={11} />
                        </button>
                            <span className="w-6 text-center text-[10px] font-bold">{qty}</span>
                            <button aria-label={`Add ${p.name}`} onClick={() => setQty(p.id, qty + 1)} className="p-1.5"><Plus size={11} /></button>
                        </div>
                    </div>
                </div>
            })}
            </div>}
    </section>
}
