# BlueSocket v3 Database Schema

BlueSocket uses **Turso (libsql)** for edge persistence. The schema is designed to support high-concurrency stateless lookups.

---

## 🏗️ Relational Diagram

- `users` (1) ⮕ (N) `connections`
- `users` (1) ⮕ (N) `sessions`
- `users` (1) ⮕ (N) `messages`
- `groups` (1) ⮕ (N) `group_members`

---

## 📊 Table Definitions

### 1. `users`
Master user records.
- `user_id`: TEXT (Primary Key)
- `username`: TEXT (Unique)
- `password_hash`: TEXT
- `created_at`: DATETIME
- `last_seen`: DATETIME (Updated on every sync/send)

### 2. `connections`
Active application instances.
- `connection_id`: TEXT (Primary Key)
- `user_id`: TEXT (FK)
- `session_id`: TEXT (FK)
- `device_id`: TEXT
- `status`: TEXT ('ACTIVE', 'INACTIVE')
- `created_at`: DATETIME
- `last_sync`: DATETIME

### 3. `messages`
Permanent record of all communication. Used for Deep Scan.
- `message_id`: TEXT (Primary Key)
- `from_user_id`: TEXT (FK)
- `to_user_id`: TEXT (Either `user_id`, `group_id`, or `COMMUNITY`)
- `connection_id`: TEXT
- `payload`: TEXT (JSON String)
- `timestamp`: DATETIME
- `status`: TEXT

### 4. `sync_events`
Transient event queue for real-time delivery.
- `event_id`: INTEGER (Auto-increment)
- `user_id`: TEXT (Recipient ID)
- `connection_id`: TEXT (Target Connection)
- `event_type`: TEXT ('message', 'notification', etc.)
- `payload`: TEXT (JSON Stringified message details)
- `timestamp`: DATETIME

### 5. `groups` & `group_members`
Permissions for targeted broadcasting.
- `groups.group_id`: TEXT (Primary Key, prefixed with `GRP_`)
- `group_members.group_id`: TEXT (FK)
- `group_members.user_id`: TEXT (FK)

---

## ⚡ Indexing Strategy
- **`sync_events(connection_id, timestamp)`**: Highly optimized for Long Polling.
- **`messages(to_user_id, timestamp)`**: Optimized for Deep Scanning.
- **`users(username)`**: Optimized for the Handshake Resolution.

---

**Tip**: Use `node scripts/initDb.js --reset` to clear all tables and recreate this schema instantly. 🧹
