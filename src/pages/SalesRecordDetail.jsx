import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import SalesSidebar from "../components/sales/SalesSidebar";
import SalesTopbar from "../components/sales/SalesTopbar";
import StatusBadge from "../components/sales/StatusBadge";
import RecentSalesOrders from "../components/sales/RecentSalesOrders";
import { money } from "../components/sales/OrderSummary";
import {
  getSalesCustomerById,
  getSalesOrderById,
  getSalesOrders,
  syncSalesOrderPayment,
  updateSalesCustomer,
} from "../services/salesApi";
import { DetailSkeleton } from "../components/sales/LoadingSkeleton";
import { validateCustomerForm } from "../utils/customerValidation";


const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";


const normalizedPhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(-10);


const addressText = (customer) =>
  [
    customer?.line1,
    customer?.line2,
    customer?.city,
    customer?.state,
    customer?.pincode,
  ].filter(Boolean);


const mapOrder = (order) => ({
  id: order.id,
  orderNumber: order.order_number,
  customer: order.customer_name || "Customer",
  phone: order.customer_phone || "—",
  amount: order.grand_total,
  payment: order.payment_status || "Pending",
  status: order.status,
  message: "—",
  createdAt: order.created_at,
  created: formatDate(order.created_at),
});


export default function SalesRecordDetail({ type }) {
  const params = useParams();

  const id =
    type === "customer"
      ? params.customerId
      : params.orderId;

  const [menu, setMenu] = useState(false);
  const [record, setRecord] = useState(null);
  const [recordType, setRecordType] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let active = true;

    const request =
      type === "customer"
        ? Promise.all([
            getSalesCustomerById(id),
            getSalesOrders({
              page: 1,
              limit: 100,
            }),
          ])
        : getSalesOrderById(id);


    Promise.resolve(request)
      .then((result) => {
        if (!active) return;

        if (type === "customer") {
          const [customer, ordersResult] = result;

          setRecord(customer);
          setRecordType("customer");

          const phone = normalizedPhone(customer.phone);

          setCustomerOrders(
            (ordersResult.items || [])
              .filter(
                (order) =>
                  phone &&
                  normalizedPhone(order.customer_phone) === phone
              )
              .map(mapOrder)
          );
        } else {
          setRecord(result);
          setRecordType("order");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.status === 404
              ? `This ${type} could not be found.`
              : requestError.message
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });


    return () => {
      active = false;
    };
  }, [id, type]);


  const backPath = `/sales-dashboard/${
    type === "customer"
      ? "customers"
      : "orders"
  }`;

  const Icon =
    type === "customer"
      ? UserRound
      : FileText;


  return (
    <div className="dashboard-shell min-h-screen">
      <SalesSidebar
        open={menu}
        setOpen={setMenu}
      />

      <div className="lg:pl-64">
        <SalesTopbar />

        <main className="dashboard-main mx-auto max-w-[1700px] space-y-5">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 text-xs font-bold text-brand"
          >
            <ArrowLeft size={15} />

            Back to{" "}
            {type === "customer"
              ? "customers"
              : "orders"}
          </Link>

          Current record details

          <header className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#e9eddf] text-brand">
              <Icon size={20} />
            </span>

            <div className="min-w-0">
              <h1 className="dashboard-title text-xl">
                {type === "customer"
                  ? "Customer details"
                  : "Order details"}
              </h1>

              <p className="mt-1 text-xs text-muted"></p>
            </div>
          </header>


          {loading && (
            <DetailSkeleton
              message={`Loading ${type} details…`}
            />
          )}


          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          )}


          {!loading &&
            !error &&
            record &&
            recordType === type &&
            (
              type === "customer" ? (
                <CustomerDetails
                  customer={record}
                  orders={customerOrders}
                  onUpdated={setRecord}
                />
              ) : (
                <OrderDetails order={record} />
              )
            )}
        </main>
      </div>
    </div>
  );
}


function CustomerDetails({
  customer,
  orders,
  onUpdated,
}) {
  const [searchParams] = useSearchParams();

  const [editing, setEditing] = useState(
    () => searchParams.get("edit") === "1"
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");


  const [form, setForm] = useState(() => ({
    full_name: customer.full_name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address_line1: customer.line1 || "",
    line2: customer.line2 || "",
    city: customer.city || "",
    state: customer.state || "",
    postal_code: customer.pincode || "",
  }));


  const fields = [
    ["full_name", "Full name"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["address_line1", "Address line 1"],
    ["line2", "Address line 2"],
    ["city", "City"],
    ["state", "State"],
    ["postal_code", "Pincode"],
  ];


  const save = async (event) => {
    event.preventDefault();

    const validation =
      validateCustomerForm(form);


    if (!validation.isValid) {
      setFormError(
        Object.values(validation.errors)[0]
      );

      return;
    }


    setSaving(true);
    setFormError("");


    try {
      const updated =
        await updateSalesCustomer(
          customer.id,
          {
            full_name:
              validation.value.full_name,

            phone:
              validation.value.phone,

            email:
              validation.value.email,

            line1:
              validation.value.address_line1,

            line2:
              form.line2.trim() || null,

            city:
              validation.value.city,

            state:
              validation.value.state,

            pincode:
              validation.value.postal_code,
          }
        );

      onUpdated(updated);
      setEditing(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-5">
      <article className="dashboard-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <UserRound
              size={17}
              className="text-brand"
            />

            Customer details
          </h2>


          <button
            type="button"
            onClick={() =>
              setEditing((value) => !value)
            }
            className="rounded-lg border border-line px-4 py-2 text-xs font-bold text-brand"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>


        {editing ? (
          <form
            onSubmit={save}
            className="p-4 sm:p-5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(([key, label]) => (
                <label
                  key={key}
                  className="text-[10px] font-bold text-muted"
                >
                  {label}

                  <input
                    value={form[key]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]:
                          event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-brand"
                  />
                </label>
              ))}
            </div>


            {formError && (
              <p className="mt-3 text-xs font-semibold text-red-600">
                {formError}
              </p>
            )}


            <button
              disabled={saving}
              className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </button>
          </form>
        ) : (
          <CustomerCard customer={customer} />
        )}
      </article>


      <RecentSalesOrders
        orders={orders}
        title={`Orders placed by ${customer.full_name}`}
        showViewAll={false}
      />
    </div>
  );
}


function CustomerCard({ customer }) {
  const address = addressText(customer);

  const initials =
    customer.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";


  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#fffefa] via-white to-[#f3f6ea] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full bg-[#dfe8cc]/50 blur-2xl" />


      <div className="relative grid gap-5 md:grid-cols-[minmax(250px,.9fr)_minmax(280px,1.1fr)]">

        {/* CUSTOMER INFORMATION */}
        <section className="flex items-center gap-4 rounded-2xl border border-[#e4e8d9] bg-white/80 p-4 shadow-[0_8px_30px_rgba(76,94,48,.07)] backdrop-blur-sm">

          <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-xl font-extrabold text-white shadow-lg shadow-[#66853d]/20">
            {initials}

            <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-[3px] border-white bg-emerald-500" />
          </div>


          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-brand">
              Customer
            </p>

            <h3 className="mt-1 truncate text-lg font-extrabold text-ink">
              {customer.full_name ||
                "Unnamed customer"}
            </h3>


            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-xs text-muted">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#eef3e5] text-brand">
                  <Phone size={12} />
                </span>

                {customer.phone ||
                  "Not provided"}
              </p>


              <p className="flex items-center gap-2 break-all text-xs text-muted">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#eef3e5] text-brand">
                  <Mail size={12} />
                </span>

                {customer.email ||
                  "Not provided"}
              </p>
            </div>
          </div>
        </section>


        {/* CUSTOMER ADDRESS */}
        <section className="rounded-2xl border border-[#e4e8d9] bg-[#fbfcf7]/90 p-4 sm:p-5">

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-brand">
                <span className="grid size-7 place-items-center rounded-lg bg-[#e8eedc]">
                  <MapPin size={14} />
                </span>

                Primary address
              </p>
            </div>


            <span className="rounded-full border border-[#dfe6d0] bg-white px-2.5 py-1 text-[9px] font-bold text-brand">
              Default
            </span>
          </div>


          {address.length ? (
            <address className="mt-4 grid gap-1 text-xs not-italic leading-relaxed text-ink">
              {address.map(
                (line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className={
                      index === 0
                        ? "font-bold"
                        : ""
                    }
                  >
                    {line}
                  </p>
                )
              )}
            </address>
          ) : (
            <p className="mt-4 text-xs text-muted">
              No address provided
            </p>
          )}


          {customer.created_at && (
            <p className="mt-4 border-t border-[#e5e9db] pt-3 text-[10px] text-muted">
              Customer since{" "}

              <span className="font-bold text-ink">
                {formatDate(
                  customer.created_at
                )}
              </span>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}


function OrderDetails({ order }) {
  const [syncing, setSyncing] =
    useState(false);

  const [syncResult, setSyncResult] =
    useState(null);

  const [syncError, setSyncError] =
    useState("");


  const customer = useMemo(
    () =>
      order.customer || {
        full_name:
          order.customer_name,

        phone:
          order.customer_phone,

        address: {},
      },
    [order]
  );


  const displayCustomer = {
    ...customer,

    line1:
      customer.address?.line1,

    line2:
      customer.address?.line2,

    city:
      customer.address?.city,

    state:
      customer.address?.state,

    pincode:
      customer.address?.pincode,
  };


  const syncPayment = async () => {
    setSyncing(true);
    setSyncError("");


    try {
      setSyncResult(
        await syncSalesOrderPayment(
          order.id
        )
      );
    } catch (error) {
      setSyncError(error.message);
    } finally {
      setSyncing(false);
    }
  };


  return (
    <div className="space-y-5">

      {/* ORDER HEADER */}
      <article className="dashboard-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <p className="text-[10px] font-bold uppercase text-muted">
              Order number
            </p>

            <h2 className="mt-1 text-xl font-extrabold">
              {order.order_number}
            </h2>
          </div>


          <StatusBadge>
            {order.status}
          </StatusBadge>
        </div>


        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">

          <p className="text-xs text-muted">
            Created{" "}
            {formatDate(
              order.created_at
            )}
          </p>


          <button
            type="button"
            disabled={syncing}
            onClick={syncPayment}
            className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {syncing
              ? "Syncing…"
              : "Sync payment status"}
          </button>
        </div>


        {syncResult && (
          <p className="mt-3 rounded-lg bg-[#edf2ef] p-3 text-xs font-semibold text-brand">
            Payment:{" "}
            {syncResult.payment_status ||
              "pending"}{" "}
            · Order:{" "}
            {syncResult.order_status}
          </p>
        )}


        {syncError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
            {syncError}
          </p>
        )}
      </article>


      {/* CUSTOMER DETAILS */}
      <article className="dashboard-card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-extrabold">
            <UserRound
              size={17}
              className="text-brand"
            />

            Customer details
          </h3>
        </div>

        <CustomerCard
          customer={displayCustomer}
        />
      </article>


      {/* ORDER ITEMS */}
      <article className="dashboard-card overflow-hidden">
        <div className="border-b border-line p-4">
          <h3 className="text-sm font-extrabold">
            Order items
          </h3>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">

            <thead className="text-muted">
              <tr>
                {[
                  "Product",
                  "SKU",
                  "Quantity",
                  "Unit price",
                  "Subtotal",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 font-semibold"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>


            <tbody>
              {(order.items || []).map(
                (item, index) => (
                  <tr
                    key={`${item.product_sku}-${index}`}
                    className="border-t border-line"
                  >
                    <td className="px-4 py-3 font-bold">
                      {item.product_name}
                    </td>

                    <td className="px-4 py-3">
                      {item.product_sku}
                    </td>

                    <td className="px-4 py-3">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3">
                      {money(
                        item.unit_price
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {money(
                        item.subtotal
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </article>


      {/* ORDER TOTAL */}
      <article className="dashboard-card ml-auto w-full max-w-md p-4 sm:p-5">
        <dl className="space-y-3 text-sm">

          <div className="flex justify-between">
            <dt className="text-muted">
              Subtotal
            </dt>

            <dd className="font-bold">
              {money(order.subtotal)}
            </dd>
          </div>


          <div className="flex justify-between">
            <dt className="text-muted">
              Discount
            </dt>

            <dd className="font-bold">
              {money(
                order.discount_total
              )}
            </dd>
          </div>


          <div className="flex justify-between">
            <dt className="text-muted">
              Shipping
            </dt>

            <dd className="font-bold">
              {money(
                order.shipping_total
              )}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted">
              GST 5%
            </dt>

            <dd className="font-bold">
              {money(
                order.gst_amount
              )}
            </dd>
          </div>


          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-extrabold">
              Grand total
            </dt>

            <dd className="font-extrabold">
              {money(
                order.grand_total
              )}
            </dd>
          </div>

        </dl>
      </article>
    </div>
  );
}
