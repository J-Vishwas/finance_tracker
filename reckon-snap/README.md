# Reckon Snap - Finance Tracker

A full-stack finance tracker with income/expense entry, date-range listing, charts (monthly overview, category breakdown), Excel bulk import, and receipt upload with OCR placeholder.

## Prerequisites
- Node.js 18+
- MongoDB running locally (or set `MONGODB_URI`)

## Setup

```bash
# Backend
cd Backend
npm install
npm run dev

# Frontend
cd ..
npm install
npm run dev
```

Backend runs on `http://localhost:3001`. Frontend runs on Vite dev port (usually `http://localhost:5173`).

## Environment
- `PORT` (optional, default 3001)
- `MONGODB_URI` (optional, default `mongodb://127.0.0.1:27017/budgettracking`)

## API Overview
Base URL: `http://localhost:3001/api`

- `GET /transactions` — List transactions with filters
  - Query params: `type=income|expense`, `category=string`, `startDate=ISO`, `endDate=ISO`
- `POST /transactions` — Create a transaction
  - Body: `{ type, amount, category, date, description }`
- `POST /transactions/bulk` — Bulk create from Excel/CSV processed data
  - Body: `{ transactions: [ ... ] }`
- `GET /monthly-overview` — Aggregated last 6 months income vs expenses
- `GET /category-breakdown` — This month expenses by category
- `GET /stats` — Balance and monthly totals
- `POST /receipts/extract` — Upload image/PDF form-data field `file` for OCR placeholder

## Frontend Features
- Add transaction form with validation
- Transactions page with server-side filters and date range
- Dashboard charts: monthly overview and category breakdown
- Receipt upload page: Excel/CSV parsing and image/PDF OCR placeholder

## Notes
- OCR is a placeholder in `Backend/routes/receipts.js`. Replace `extractReceiptData` with a real OCR (e.g., Tesseract.js or an API like Google Vision) as needed.
- Error handling: centralized error middleware returns JSON with `{ error }` and proper HTTP status codes.
- CORS is configured for local dev ports.

## Project Structure (Backend)
```
Backend/
  models/
    Transaction.js
  routes/
    transactions.js
    receipts.js
  server.js
```

## License
MIT
