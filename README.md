# Speedy Eats Tracker

A modern food delivery tracking application built with React, TypeScript, and Node.js.

## Features

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: Node.js + Express + SQLite
- **Order Management**: Place orders, track status, admin panel
- **File Uploads**: Payment screenshot uploads
- **Real-time Updates**: Hot reloading for development

## Project Structure

```
speedy-eats-tracker-main/
├── backend/                 # Node.js/Express backend
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── speedy_eats.db      # SQLite database (created automatically)
│   └── uploads/            # Uploaded payment screenshots
├── src/                    # React frontend
│   ├── lib/
│   │   ├── api.ts          # API client functions
│   │   └── store.ts        # Data types and exports
│   └── pages/              # React components
└── package.json            # Frontend dependencies
```

## Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the root directory:
   ```bash
   cd speedy-eats-tracker-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:8080` (or next available port)

## API Endpoints

### Orders

- `GET /api/orders` - Get all orders
- `GET /api/orders/:token` - Get order by token
- `POST /api/orders` - Create new order (with file upload)
- `PUT /api/orders/:token/status` - Update order status
- `DELETE /api/orders/:token` - Delete order
- `DELETE /api/orders` - Clear all orders

### File Uploads

Payment screenshots are stored in the `backend/uploads/` directory and served at `/uploads/:filename`

## Database

The application uses SQLite database (`speedy_eats.db`) which is created automatically when the backend starts.

## Development

- Frontend hot reloading with Vite
- Backend hot reloading with nodemon
- TypeScript support for both frontend and backend
- ESLint configuration for code quality

## Admin Access

Access the admin panel at `/admin` with PIN: `1234`
