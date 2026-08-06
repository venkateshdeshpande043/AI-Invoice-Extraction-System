# Invoice Extractor — AI-Powered Invoice Processing System

An intelligent invoice extraction system that allows finance teams to upload invoice images or PDFs and automatically extract structured data using OCR and NLP.

## Architecture

```
invoice-extractor/
├── client/               # React + Vite + Tailwind CSS (frontend)
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── layouts/      # Auth & dashboard layouts
│       ├── hooks/        # Custom React hooks
│       ├── context/      # Auth context provider
│       ├── services/     # Axios API client
│       ├── utils/        # Formatters, validators, constants
│       └── routes/       # Route definitions
├── server/               # Node.js + Express + MongoDB (backend)
│   └── src/
│       ├── config/       # DB, env, CORS, logger config
│       ├── models/       # Mongoose schemas
│       ├── controllers/  # Route handlers
│       ├── routes/       # Express routes
│       ├── services/     # OCR, NLP, storage, export
│       ├── storage/      # Pluggable storage drivers
│       ├── middleware/    # Auth, upload, validation, error handling
│       ├── validators/   # Request validation schemas
│       └── utils/        # Helpers, regex patterns, custom errors
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (via Mongoose) |
| OCR | PaddleOCR (Python microservice, FastAPI) |
| NLP | Regex + JavaScript processing |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer (local storage with pluggable driver) |
| Logging | Winston |
| Validation | express-validator |

## Prerequisites

- **Python** v3.8 or higher (for PaddleOCR microservice)
- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** account (free tier works) — [Sign up here](https://www.mongodb.com/atlas)

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd invoice-extractor
npm run install:all
```

### 2. Install Python dependencies for OCR microservice

```bash
pip install -r ocr-service/requirements.txt
```

### 3. Configure environment variables

The server reads environment variables from `.env` or `.env.local` at the project root or `server/` directory. Required variables:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/invoice-extractor
JWT_SECRET=your-random-64-char-secret-key
```

See `server/.env.example` for the full list of configurable variables.

### 4. Run the application

```bash
# From the root directory — starts all three services independently
npm run dev
```

This launches:
| Service | URL | Health Check |
|---------|-----|-------------|
| **Frontend** (Vite) | http://localhost:5173 | — |
| **Backend** (Express) | http://localhost:5000 | http://localhost:5000/api/health |
| **OCR** (PaddleOCR) | http://localhost:8765 | http://localhost:8765/health |

### 5. Create an account

Navigate to http://localhost:5173/register and create your account. Then start uploading invoices!

## Running & Stopping Services

### Start all services (recommended)

```bash
npm run dev
# or
bash scripts/start.sh
```

The startup script (`scripts/start.sh`) launches each service **independently** in the background. If one service crashes (e.g., OCR service), the frontend and backend continue running. The frontend shows a warning banner if any required service is unavailable.

### Stop all services

```bash
bash scripts/stop.sh
# or press Ctrl+C in the start.sh terminal
```

### Start services individually

```bash
# Start OCR microservice only
cd ocr-service && python3 main.py

# Start Express backend only (with nodemon for auto-restart)
npm run dev:server

# Start Vite frontend only
npm run dev:client
```

### Verify service health

```bash
# Full stack health check (backend + MongoDB + OCR)
curl http://localhost:5000/api/health

# OCR service only
curl http://localhost:8765/health
```

### Example health responses

**All services healthy:**
```json
{
  "success": true,
  "message": "Invoice Extractor API is running",
  "database": "connected",
  "ocr": "connected",
  "timestamp": "..."
}
```

**Service unavailable:**
```json
{
  "success": true,
  "message": "Some services are unavailable",
  "database": "connected",
  "ocr": "disconnected",
  "timestamp": "..."
}
```

## API Documentation

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create a new account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Invoice Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/invoices/upload` | Upload invoice file (multipart/form-data) | Yes |
| GET | `/api/invoices` | List invoices (with search & pagination) | Yes |
| GET | `/api/invoices/:id` | Get invoice details | Yes |
| DELETE | `/api/invoices/:id` | Delete an invoice | Yes |
| GET | `/api/invoices/:id/export?format=json` | Export as JSON | Yes |
| GET | `/api/invoices/:id/export?format=csv` | Export as CSV | Yes |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | Yes |

### Query Parameters for GET /api/invoices

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by invoice number or vendor name |
| `vendor` | string | Filter by vendor name |
| `status` | string | Filter by status (pending, processed, failed) |
| `dateFrom` | date | Filter invoices from this date (ISO 8601) |
| `dateTo` | date | Filter invoices to this date (ISO 8601) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `sortBy` | string | Sort field (createdAt, invoiceDate, totalAmount, vendorName) |
| `sortOrder` | string | Sort order (asc, desc) |

## Features

- **User Authentication** — JWT-based registration and login
- **Dashboard** — Overview with stats, monthly chart, recent uploads
- **Invoice Upload** — Drag-and-drop or click to upload (JPG, PNG, PDF)
- **OCR Extraction** — PaddleOCR engine for text detection from images and PDFs
- **NLP Parsing** — Regex-based extraction of invoice fields:
  - Invoice number, vendor name, dates, GST/VAT number
  - Line items (description, quantity, unit price, amount)
  - Subtotal, tax, total amount, currency
- **Search & Filter** — Search by keyword, filter by vendor, status, date range
- **Export** — Download extracted data as JSON or CSV
- **Responsive UI** — Works on desktop, tablet, and mobile

## Project Structure

### Server (backend)

```
server/
├── server.js                     # Entry point
├── package.json
├── .eslintrc.json
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── env.js                # Environment variable validation
│   │   ├── cors.js               # CORS configuration
│   │   └── logger.js             # Winston logger
│   ├── models/
│   │   ├── User.js               # User schema
│   │   └── Invoice.js            # Invoice schema
│   ├── controllers/
│   │   ├── authController.js     # Auth handlers
│   │   ├── invoiceController.js  # Invoice CRUD handlers
│   │   └── dashboardController.js # Dashboard stats
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   ├── ocrService.js         # Google Vision API
│   │   ├── nlpService.js         # Regex parsing
│   │   ├── storageService.js     # File storage abstraction
│   │   └── exportService.js      # JSON/CSV export
│   ├── storage/
│   │   ├── index.js              # Driver factory
│   │   ├── LocalStorageDriver.js # Local disk storage
│   │   └── GcsStorageDriver.js   # GCS placeholder
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── uploadMiddleware.js   # Multer config
│   │   ├── validateMiddleware.js # Request validation
│   │   ├── errorMiddleware.js    # Error handler
│   │   └── rateLimiter.js        # Rate limiting
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── invoiceValidators.js
│   ├── utils/
│   │   ├── AppError.js           # Custom error class
│   │   ├── catchAsync.js         # Async error wrapper
│   │   ├── regexPatterns.js      # Invoice regex patterns
│   │   └── helpers.js            # Utility functions
│   └── uploads/                  # File storage directory
```

### Client (frontend)

```
client/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── public/
└── src/
    ├── main.jsx                  # Entry point
    ├── App.jsx                   # App component
    ├── index.css                 # Tailwind + custom styles
    ├── assets/
    │   ├── images/
    │   └── icons/
    ├── components/
    │   ├── common/               # Button, Input, Modal, Toast, etc.
    │   ├── layout/               # Navbar, Sidebar, DashboardLayout
    │   ├── invoice/              # InvoiceCard, InvoiceTable, InvoiceDetail
    │   ├── upload/               # FileUploadZone, FilePreview, UploadProgress
    │   └── search/               # SearchBar, FilterPanel
    ├── pages/                    # Login, Register, Dashboard, Upload, etc.
    ├── layouts/                  # AuthLayout, AppLayout
    ├── hooks/                    # useAuth, useInvoices, useFileUpload
    ├── context/                  # AuthContext
    ├── services/                 # Axios API client
    ├── utils/                    # Constants, formatters, validators
    └── routes/                   # AppRoutes
```

## Storage Abstraction

The storage layer uses a **plugable driver pattern** to keep file storage modular:

1. **LocalStorageDriver** (default) — saves files to `server/src/uploads/{year}/{month}/` with UUID filenames
2. **GcsStorageDriver** (placeholder) — ready to implement when Google Cloud Storage billing is enabled

To switch to GCS later:
1. Set `GOOGLE_APPLICATION_CREDENTIALS` and `GCS_BUCKET` in `.env`
2. Set `STORAGE_DRIVER=gcs`
3. Implement the methods in `server/src/storage/GcsStorageDriver.js`
4. Restart the server — the abstraction layer handles the rest

## OCR Pipeline

1. **File upload** — Multer saves file to temp directory
2. **Image OCR** — PaddleOCR engine extracts text from images (runs as a Python FastAPI microservice on port 8765)
3. **PDF OCR** — pdf-parse extracts text directly; falls back to PaddleOCR with PyMuPDF rendering for scanned PDFs
4. **Graceful fallback** — If PaddleOCR is unreachable, the app uses pdf-parse for PDFs and returns a clear error for images

## NLP Pipeline

The NLP service processes raw OCR text using regex patterns to extract:

- Invoice number (INV-XXXX, INVOICE #XXXX patterns)
- Vendor name (after "Bill From", "Vendor", "Supplier" labels)
- Invoice date and due date (multiple date formats supported)
- GST/VAT number (Indian GST format, UK VAT, US EIN)
- Line items (tabular data with description + quantity + rate + amount)
- Subtotal, tax, total amount
- Currency detection (INR, USD, EUR, GBP)

## Scripts

| Script | Description |
|--------|-------------|
| Script | Description |
|--------|-------------|
| `npm run dev` / `npm run start` | Run all three services independently (recommended) |
| `npm run stop` | Stop all running services |
| `npm run dev:concurrently` | Run all three services via concurrently (legacy) |
| `npm run dev:client` | Run Vite dev server only |
| `npm run dev:server` | Run Express server with nodemon only |
| `npm run dev:ocr` | Run PaddleOCR microservice only |
| `npm run install:all` | Install dependencies for root, client, and server |
| `npm run lint` | Run ESLint on both client and server |
| `npm run format` | Run Prettier on both client and server |

## Startup Architecture

Each service runs as an **independent background process**. If one fails, the others continue running.

```
┌──────────────────────────────────────────────────┐
│                scripts/start.sh                   │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ PaddleOCR    │  │ Express API  │  │ Vite     │ │
│  │ :8765        │  │ :5000        │  │ :5173    │ │
│  │ (Python)     │  │ (Node.js)    │  │ (React)  │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
│         │                 │               │       │
│         └─────────────────┼───────────────┘       │
│                    Vite Proxy (/api → :5000)       │
└──────────────────────────────────────────────────┘
```

**PID files** are stored in `.pids/` so the `stop.sh` script can cleanly shut down each service.

## Frontend Service Status

The frontend automatically checks the health of the backend and OCR services every 30 seconds:
- If the **backend** is unreachable → shows "Backend server is not running"
- If the **database** is disconnected → shows warning
- If the **OCR** is disconnected → shows warning (upload still works, but extraction fails)
- All warnings include a **Retry** button

## Production Deployment

For deployment, build the static frontend and serve it from Express:

```bash
npm run build --prefix client
```

Configure your production environment variables and run `node server/server.js`. The OCR microservice must also be running alongside.

## Development Notes

- **Without PaddleOCR:** The OCR service gracefully degrades. PDFs are still parsed via `pdf-parse`, but images will fail extraction.
- **MongoDB Atlas free tier:** Works perfectly for development and small-scale use.
- **ESLint + Prettier:** Run `npm run lint` and `npm run format` to maintain code quality.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI` not set | Add `MONGODB_URI` to the workspace's API Keys section |
| Frontend shows "Backend server is not running" | Run `bash scripts/start.sh` or check `/tmp/server.log` |
| Frontend shows "OCR Engine" unavailable | Run `cd ocr-service && python3 main.py` or check `/tmp/ocr-service.log` |
| No text extracted from image | Check OCR service: `curl http://localhost:8765/health` |
| Upload fails with 413 | Increase `MAX_FILE_SIZE` in `.env` |
| Login returns 401 | Check JWT_SECRET is consistent across restarts |
| Port conflict errors | Run `bash scripts/stop.sh` first to clean up old processes |
