# Reckon Snap - Finance Tracker

A modern full-stack finance tracking application built with React, Express, and MongoDB. Track expenses, analyze spending patterns, and manage receipts with ease.
<img width="1887" height="967" alt="Screenshot 2025-09-26 014413" src="https://github.com/user-attachments/assets/96b5cfd5-be26-4033-bd8d-186ac990c91f" />

## Features

- 📊 Interactive dashboard with spending analytics
- 💰 Income and expense tracking
- 📅 Date-range transaction filtering
- 📈 Monthly overview and category breakdown charts
- 📑 Bulk import via Excel/CSV
- 📸 Receipt upload support (images/PDF)
- 🔐 User authentication via Clerk

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, MongoDB
- **Authentication**: Clerk
- **File Handling**: Multer
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+
- MongoDB
- Clerk account for authentication

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd reckon-snap
```

2. Install dependencies:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd Backend
npm install
```

3. Configure environment variables:

Frontend (.env.local):
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Backend (.env):
```
CLERK_SECRET_KEY=your_clerk_secret_key
MONGODB_URI=mongodb://127.0.0.1:27017/budgettracking
```

4. Start the development servers:

```bash
# Backend (from Backend directory)
npm run dev

# Frontend (from root directory)
npm run dev
```

## API Endpoints

- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/bulk` - Bulk create from Excel/CSV
- `GET /api/monthly-overview` - Get 6-month income vs expenses
- `GET /api/category-breakdown` - Get expenses by category
- `POST /api/receipts/extract` - Upload and process receipts

## Project Structure

```
reckon-snap/
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── lib/             # Utilities
├── Backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── server.js        # Express server
└── public/              # Static assets
```

## Development

- Run `npm run lint` to check for code style issues
- Run `npm run build` to create production build
- Run `npm run preview` to preview production build

## Notes

- Receipt OCR functionality is currently a placeholder
- CORS is configured for local development
- File upload size limit: 10MB

## License

MIT
