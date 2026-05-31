# BlueSocket

Stateless HTTPS-based real-time communication framework for Vercel and Turso.

## Overview

BlueSocket is a protocol designed for high-performance, stateless real-time communication without persistent socket connections. It leverages incremental synchronization and session-based registration to achieve near real-time performance on serverless environments.

## Tech Stack

- **Frontend:** Vue 3, Vite, JavaScript
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Turso (LibSQL)
- **Auth:** JWT + Session-based

## Quick Start

### 1. Prerequisites
- Node.js installed
- Turso account and a database created

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database
```bash
node scripts/initDb.js
```

### 5. Run Development Server
```bash
npm run dev
```

## Documentation

Detailed documentation can be found in the `/docs` directory:
- [Architecture](./docs/architecture.md)
- [Database Schema](./docs/database.md)
- [Security](./docs/security.md)
- [API Reference](./docs/api.md)
- [Protocol Specification](./docs/bluesocket-protocol.md)
- [Deployment](./docs/deployment.md)
- [Admin Monitor](./docs/admin-monitor.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Deployment

Deploy to Vercel:
```bash
vercel
```
Ensure you set the environment variables in the Vercel dashboard.
