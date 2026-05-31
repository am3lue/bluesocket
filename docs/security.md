# BlueSocket v3 Security Model

BlueSocket is designed with a "Defense in Depth" approach to secure a stateless community environment.

---

## 🔐 1. Identity & Handshaking
- **JWT (JSON Web Tokens)**: All requests are authenticated via a signed JWT. Tokens are short-lived (1 hour) and linked to a server-side session.
- **Intentional Handshaking**: User UUIDs are never exposed in bulk. Clients must explicitly "Resolve" a username to get its private communication key. This prevents broad user-scraping.

---

## 📡 2. Transport Security
- **Strict HTTPS**: All traffic is encrypted over TLS. 
- **CORS Management**: The API implements a custom CORS middleware (`api/_lib/cors.js`) to prevent unauthorized cross-origin attacks while allowing intentional browser-based clients.

---

## 🗄️ 3. Database Security
- **Parameterized Queries**: Every database interaction uses the `@libsql/client` parameter binding to 100% prevent SQL Injection.
- **Atomic Transactions**: Multi-step operations (like sending a community message) are wrapped in ACID-compliant transactions to prevent data leaks or partial delivery.

---

## 🛡️ 4. Resilience & Protection
- **Vercel WAF**: The protocol is optimized for Vercel's Edge Firewall.
- **Cool-Down Logic**: I've built 1-second "Breathing" logic into the reference apps to prevent triggering rate-limiters during high-frequency tasks (like counting).
- **Stateless Requests**: By never holding a socket open, the server is immune to "Socket Pinning" or slow-loris attacks.

---

## ⚠️ 5. Production Recommendations
- **Password Hashing**: The current prototype uses plaintext for demo speed. **Production requires Argon2/bcrypt hashing.**
- **Secret Management**: Ensure `JWT_SECRET` is at least 32 characters long and rotated periodically.

**Secure. Intentional. Stateless.** 🚀🔥🍼🛡️
