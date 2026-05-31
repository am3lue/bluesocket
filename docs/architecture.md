# BlueSocket Architecture

## statelessness
BlueSocket is designed for serverless environments where persistent connections (WebSockets) are difficult to maintain. Every request is independent and carries its own authentication context.

## Core Components

### 1. Synchronization Engine
Instead of pushing data to clients, BlueSocket uses a "Synchronization Engine". Clients pull incremental updates using a `last_sync_timestamp`.

### 2. Event Store
All communication events are stored in the database. When a message is sent, it's not just stored as a message but also as a `sync_event` for the recipient.

### 3. Presence System
Presence is derived from the last time a client contacted the synchronization endpoint. 
- **ONLINE:** < 10s since last contact.
- **AWAY:** 10s - 60s since last contact.
- **OFFLINE:** > 60s since last contact.

## Data Flow

1. **Client A** sends a POST request to `/api/bluesocket/send`.
2. **Server** validates session, stores the message, and creates a `sync_event` for **Client B**.
3. **Client B** polls `/api/bluesocket/sync` with its `last_sync_timestamp`.
4. **Server** returns all `sync_events` newer than the timestamp.
5. **Client B** updates its local state and updates its `last_sync_timestamp`.
