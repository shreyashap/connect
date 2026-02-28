# Connect

Real-time chat application.

## Setup

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### 1. Server

```bash
cd server
npm install
```

Create a `.env` file:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Start the server:

```bash
npm run dev
```

### 2. Client

```bash
cd client
npm install
npm run dev
```

The app runs at **http://localhost:3000** and the server at **http://localhost:5000**.

## Test Credentials

Register two accounts to test, or use these if already seeded:

| Email              | Password  |
| ------------------ | --------- |
| test1@test.com     | test1234  |
| test2@test.com     | test1234  |

> If these don't exist yet, simply register them at `/register`.
