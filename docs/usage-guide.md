# BlueSocket Protocol v3 - Usage Guide

BlueSocket is a **stateless, HTTPS-based real-time communication protocol** designed for serverless environments (Vercel) and edge databases (Turso). 

## 🏗️ Architecture: The "Middle Man"
Instead of persistent connections, BlueSocket uses a "mailbox" system.
1. **Sender** drops a message in a specific mailbox.
2. **Server** (The Middle Man) verifies the sender and routes the message.
3. **Receiver** "syncs" (polls/long-polls) to pick up new mail.

---

## 🔐 1. Authentication
Every request requires a JWT token in the header:
`Authorization: Bearer <your_token>`

**Endpoint:** `POST /api/auth/login`
**Payload:** `{ "username": "...", "password": "..." }`
*Note: New users are automatically created on first login.*

---

## 📱 2. Connection Registration
Before receiving messages, an app instance must register to get a `connection_id`.

**Endpoint:** `POST /api/bluesocket/register`
**Payload:** `{ "device_id": "unique_id", "device_type": "web|mobile" }`
**Response:** `{ "connection_id": "conn_..." }`

---

## 📡 3. The 3-Tier Messaging Model
BlueSocket supports three distinct ways to communicate:

### A. Community (Global Broadcast)
Sends to **every** active user in the system.
*   **Target (`to_user_id`)**: `"COMMUNITY"`
*   **Visibility**: Public.

### B. Group (Targeted Broadcast)
Sends only to members of a specific group.
*   **Target (`to_user_id`)**: `"GRP_XXXX"` (e.g., `GRP_DEV`)
*   **Visibility**: Members only.
*   **Join Group**: `POST /api/bluesocket/join-group` with `{ "group_id": "..." }`.

### C. Private (1-to-1)
Secure communication between two specific users.
*   **Target (`to_user_id`)**: The recipient's `user_id` (e.g., `usr_abc123`).
*   **Visibility**: Sender & Receiver only.

---

## 📥 4. Receiving Data (Long Polling)
To receive data in real-time without a loop, use **Long Polling**. The server will hold the request open until new data arrives.

**Endpoint:** `GET /api/bluesocket/sync`
**Parameters:** 
- `connection_id`: Your ID
- `last_sync_timestamp`: (Optional) Get mail newer than this.
- `wait`: `true` (Enables real-time waiting)

**Example JS:**
```javascript
while(true) {
  const res = await fetch('/api/bluesocket/sync?connection_id=...&wait=true');
  const data = await res.json();
  // Handle data.events
}
```

---

## 🟢 5. Presence System
To see who is currently online in the community.

**Endpoint:** `GET /api/bluesocket/presence`
**Returns:** List of users and their status (`ONLINE`, `AWAY`, `OFFLINE`).

---

## 🛠️ Testing the Ecosystem
I've provided a full testing suite in the `/scripts` folder:
1. **`version1/`**: Automated Node.js counting bots.
2. **`version2/`**: Simple interactive HTML prototypes.
3. **`version3/`**: **Full Community Experience**. Use these to test Group 1, Community Square, and Private messaging across multiple browser tabs.

**Broskii, you now have a production-ready, stateless social engine! 🚀🔥🍼**
