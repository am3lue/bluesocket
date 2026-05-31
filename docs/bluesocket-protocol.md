# BlueSocket Protocol Specification

The BlueSocket protocol is a stateless, pull-based communication protocol designed for HTTPS.

## 1. Lifecycle

### Registration
Each application instance must register to receive a `connection_id`. This ID is used to route `sync_events`.

### Polling (Synchronization)
Clients poll the `/sync` endpoint. The interval is typically 2 seconds but can be adaptive.
- **Fast Mode:** 1s (active user)
- **Normal Mode:** 2s (background user)
- **Power Save:** 10s+ (inactive user)

### Acknowledgement
While the protocol is pull-based, the server marks events as "delivered" implicitly when the client polls with a timestamp greater than the event's timestamp. Explicit `ack` can be implemented via `/api/bluesocket/ack`.

## 2. Event Types
- `message`: Textual or multimedia message content.
- `notification`: System-level alert.
- `presence_update`: When a contact changes status (optional optimization).
- `typing`: Transient state (adaptive polling recommended).

## 3. Statelessness
No memory of the client's socket is kept on the server. The database is the "source of truth" for what events haven't been delivered yet.
