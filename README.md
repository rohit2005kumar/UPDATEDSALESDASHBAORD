# Ayudravya Sales Dashboard

This Vite frontend connects only to the standalone Sales Backend described in
`SALES_FRONTEND_API_INTEGRATION.md`.

## Environment

```env
VITE_SALES_API_BASE_URL=https://ayudravya-sales-backend.onrender.com/api/v1
```

The value must include the `/api/v1` prefix. The frontend does not use the main
customer backend or any admin, accountant, or services/operations APIs.

## Development

```bash
npm install
npm run dev
```

The API client permits only the 12 documented Sales Backend method/path
combinations. Sales JWTs are stored in `sessionStorage` and removed on logout,
expiry, or a `401` response.
