# BlueSocket v3 Architecture & Protocol

## 🛡️ The Philosophy of Statelessness

Traditional real-time systems (WebSockets) rely on a persistent TCP connection. While fast, they are expensive to scale and incompatible with serverless environments like Vercel, which "kills" processes immediately after a request.

**BlueSocket v3** achieves real-time speeds by shifting the responsibility of "Connection" from the RAM of the server to the **Persistence Layer** (Database).

---

## 🏗️ Core Components

### 1. The Monolithic Middle-Man (`api/index.js`)
To stay within the Vercel Hobby limits, the entire API is unified. It handles:
- **Routing**: Internal path-based logic.
- **Authentication**: JWT verification on every request.
- **Transaction Management**: Atomic database operations.

### 2. The Sync Engine (Long-Polling)
The protocol uses a "Wait & Notify" strategy. When a client calls `/api/sync?wait=true`:
1.  The server checks the database for new events.
2.  If empty, it **sleeps** (using an async delay) for 1 second.
3.  It re-checks the database.
4.  This repeats for up to 8-10 seconds.
5.  If a message arrives in that window, it is returned **immediately**.

### 3. Deep-Scan History
New connections often miss the "broadcast" event sent just before they were online. BlueSocket performs a **Deep Scan** of the `messages` table during every sync, comparing the client's `last_sync_timestamp` to the global message history to ensure 100% delivery reliability.

---

## 🤝 The Handshake Protocol

BlueSocket v3 introduces a mandatory resolution step for private communication:

```mermaid
sequenceDiagram
    participant Client A
    心participant Server
    participant DB
    
    Client A->>Server: Resolve "Username_B"
    Server->>DB: Query User UUID
    DB-->>Server: Return usr_7721...
    Server-->>Client A: Return Secure Key (UUID)
    Client A->>Client A: Store Key in Contact Book
```

---

## 📡 Messaging Logic

### Broadcast (Community)
- **Target**: `to_user_id = 'COMMUNITY'`
- **Effect**: Server generates a `sync_event` for **every** connection currently marked as `ACTIVE`.

### Targeted (Groups)
- **Target**: `to_user_id = 'GRP_XXXX'`
- **Effect**: Server uses a sub-query to find all `user_id`s in the `group_members` table and generates events only for them.

### Secure (Private)
- **Target**: `to_user_id = 'usr_uuid'`
- **Effect**: 1-to-1 event generation. Completely isolated from the community feed.

---

## ⚡ Performance Considerations
- **Vercel Lambda**: Requests are limited to 10s duration on Hobby.
- **Turso DB**: Optimized for edge-latency.
- **Payload Size**: Keep payloads under 4KB for optimal sync performance.

**BlueSocket v3: Turning stateless functions into a stateful community.** 🚀🔥🍼
