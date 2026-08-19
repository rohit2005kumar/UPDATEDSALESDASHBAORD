# Backend request: public payment status endpoint

The frontend payment flow is complete except for one gap. Everything else is wired
against the endpoints that already exist in the deployed TEST Sales backend.

## Why this is needed

`POST /api/v1/sales/pay/{token}/verify-payment` can legitimately answer:

```json
{ "order_id": "…", "payment_status": "pending", "order_status": "…", "verified": false }
```

The spec says the customer page must then show "Payment is being confirmed…" and
**poll the backend every 5–10 seconds** until it settles.

There is currently **no public endpoint that returns a payment status for a token**:

| Endpoint | Returns status? |
|---|---|
| `GET /api/v1/sales/pay/{token}` | ❌ `PublicPayPageResponse` — order lines and totals only, no `payment_status`, no `link_status` |
| `POST /api/v1/sales/pay/{token}/verify-payment` | ✅ but it is a POST that requires the 3 Razorpay values, so it is not a polling endpoint |
| `GET /api/v1/sales/payment-links` | ✅ but it is **agent-authenticated** — the customer has no JWT |

So the customer is left on "confirming…" with nothing to poll.

## Requested endpoint

```
GET /api/v1/sales/pay/{token}/status
```

- **Auth:** none (public, same as the other `/pay/{token}` routes). Token in path is the credential.
- **Path param:** `token` — the same share-link token already used by `/pay/{token}`.
- **Request body:** none.

### Response `200` — suggested `PublicPaymentStatusResponse`

```json
{
  "order_id": "3f1c…-uuid",
  "payment_status": "pending",
  "order_status": "awaiting_payment",
  "link_status": "active"
}
```

| Field | Type | Values the frontend handles |
|---|---|---|
| `order_id` | string (uuid) | — |
| `payment_status` | string \| null | `null`, `"pending"`, `"failed"`, `"success"` |
| `order_status` | string | free text, displayed only |
| `link_status` | string | `"active"`, `"paid"`, `"expired"`, `"cancelled"` |

Optional extras the frontend will ignore safely if present: `provider_payment_id`,
`paid_at`, `expires_at`, `verified`.

### Error responses

| Code | Meaning | Frontend behaviour |
|---|---|---|
| `404` | unknown / deleted token | polling stops, page shows a neutral "being confirmed" message — **never** a failure screen |
| `410` | expired token | same as 404 |
| `5xx` | transient | frontend silently retries on the next tick |

## Frontend contract (already implemented)

- Polls **every 6 s**, max **20 attempts (~2 min)**, only while `payment_status === "pending"`.
- `payment_status = "success"` **or** `link_status = "paid"` → navigate to `/payment-success`.
- `payment_status = "failed"` → navigate to `/payment-failed`.
- Anything else (`null`, `"pending"`, unknown) → stay on "Payment is being confirmed…".
- The frontend never writes a status, never PATCHes `pending → success`, and never calls
  `POST /api/v1/sales/payments/webhook/razorpay`.
- Until this endpoint exists the poll receives `404`, stops cleanly, and the customer sees a
  neutral confirming message. **Nothing breaks** — the success/failure paths that go through
  `verify-payment` already work today.

## Two smaller notes on the existing API

1. `create-payment` returns `provider_order_id` and `amount_paise` (not `razorpay_order_id` /
   `amount`). The frontend uses the actual field names, so no change is needed — just flagging
   it because the written spec used the `razorpay_*` names.
2. `PublicPayPageResponse` has no `customer_email` / `customer_phone`, so the Razorpay Checkout
   `prefill` for email and contact is empty. If you want them prefilled, add those two fields to
   `GET /api/v1/sales/pay/{token}` and the frontend will pick them up with no code change.
