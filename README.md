# 🚀 BlueSocket v3 - The Community Protocol

**BlueSocket** is a production-ready, stateless, HTTPS-based real-time communication framework. It is specifically designed to bypass the limitations of WebSockets in serverless environments like **Vercel** while maintaining a near real-time experience using an advanced **Long-Polling Synchronization Engine**.

---

## 🏗️ Core Architecture: "The Stateless Middle-Man"

Unlike traditional socket servers that hold an open line to every user (draining RAM and CPU), BlueSocket operates like a high-speed postal service:

1.  **Stateless API**: Every request is independent. The server wakes up, processes a message, and dies.
2.  **The Mailbox (Turso)**: All messages and events are stored in a highly-available SQLite edge database.
3.  **Synchronization Engine**: Clients use a "Blocking Sync" (Long Polling) to wait for new mail. The server holds the request open until data arrives, providing instant delivery.

---

## 📡 3-Tier Communication Model

BlueSocket is built for communities, supporting three distinct levels of visibility:

1.  **🌐 COMMUNITY (Global)**: A system-wide broadcast. Every active connection receives these messages.
2.  **👥 GROUP (Targeted)**: Messages sent to a specific `group_id`. Only verified members of that group see the data.
3.  **🔒 PRIVATE (1-to-1)**: Secure, encrypted-at-rest communication between two specific User UUIDs.

---

## 🤝 The 3-Way Handshake

For maximum security, BlueSocket uses an intentional handshake protocol:
- **Phase 1 (Request)**: App A requests a connection to "Username B".
- **Phase 2 (Resolve)**: The Middle Man validates the existence of "Username B" and retrieves their unique UUID Key.
- **Phase 3 (Secure Session)**: App A locks all future private communication to that verified UUID Key.

---

## 📂 Project Structure

```text
├── api/
│   ├── _lib/            # Shared DB, Auth, and CORS logic
│   └── index.js         # Unified Monolithic Serverless Function
├── docs/                # Comprehensive technical documentation
├── scripts/
│   ├── initDb.js        # Database setup & Reset utility
│   ├── version1/        # Node.js automated testing bots
│   ├── version2/        # Simple interactive HTML prototypes
│   └── version3/        # Full Community "4-Phone" Simulation
├── src/                 # Main Vue 3 Frontend (Admin Dashboard)
└── vercel.json          # Deployment & Routing configuration
```

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Copy `.env.example` to `.env` and fill in your **Turso** and **JWT** credentials.

### 2. Initialize Database
Create the community schema or reset it to a clean state:
```bash
node scripts/initDb.js          # Normal Setup
node scripts/initDb.js --reset  # Wipe and Start Over
```

### 3. Deploy
Push to GitHub and connect to Vercel. BlueSocket will automatically configure its monolithic API.

### 4. Live Test (The 4-Phone Simulation)
Navigate to `scripts/version3/` and open `phone_a.html`, `phone_b.html`, `phone_c.html`, and `phone_d.html` in separate tabs. Watch them perform a 3-way handshake and start communicating in real-time across channels.

---

## 🛠️ Technical Documentation

- [Detailed Usage Guide](./docs/usage-guide.md)
- [Architecture & Protocol](./docs/architecture.md)
- [Database Schema](./docs/database.md)
- [Security Model](./docs/security.md)
- [Vercel Deployment](./docs/deployment.md)

---

**Built for the community. Scalable by design. 100% Stateless.** 🚀🔥🍼
