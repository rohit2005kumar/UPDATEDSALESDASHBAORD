import { LockKeyhole } from "lucide-react";
import { money } from "./OrderSummary";

export default function CustomerPaymentPreview({
  data,
  onPay,
  paying,
}) {
  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-[#fffefa] p-5">
        <img
          src="/ayudravya-logo.png"
          alt="Ayudravya"
          className="size-14 object-contain mix-blend-multiply"
        />

        <div>
          <div className="dashboard-title text-lg text-[#705019]">
            Ayudravya
          </div>

          <div className="text-[10px] text-muted">
            Secure order review
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-muted">
              Customer
            </div>

            <b className="text-sm">
              {data.customer_name}
            </b>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[10px] text-muted">
              Order
            </div>

            <b className="text-xs">
              {data.order_number}
            </b>
          </div>
        </div>

        <div className="space-y-3">
          {data.items.map((item, index) => (
            <div
              key={`${item.product_name}-${index}`}
              className="flex items-start justify-between gap-3 border-b border-line pb-3 text-xs"
            >
              <div className="min-w-0">
                <b>
                  {item.product_name}
                </b>

                <div className="mt-1 text-[10px] text-muted">
                  Qty {item.quantity} × {money(item.unit_price)}
                </div>
              </div>

              <b className="shrink-0">
                {money(item.line_total)}
              </b>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between text-muted">
            <span>
              Subtotal
            </span>

            <span>
              {money(data.subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-muted">
            <span>
              Shipping
            </span>

            <span>
              300
            </span>
          </div>
          <div className="flex justify-between text-muted">
            <span>
              GST
            </span>

            <span>
              5%
            </span>
          </div>

          <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
            <span>
              Grand total
            </span>

            <span>
              {money(data.grand_total)}
            </span>
          </div>
        </div>

        <button
          onClick={onPay}
          disabled={paying}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60"
        >
          <LockKeyhole size={14} />

          {paying
            ? "Opening secure checkout…"
            : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
