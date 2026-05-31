# BlueSocket API Reference

## Auth

### POST /api/auth/login
Login or Register a user.
- **Body:** `{ username, password }`
- **Response:** `{ token, user: { user_id, username, session_id } }`

### POST /api/auth/logout
Invalidate current session.
- **Header:** `Authorization: Bearer <token>`
- **Response:** `{ message }`

## BlueSocket Core

### POST /api/bluesocket/register
Register a new connection instance.
- **Body:** `{ device_id, device_type }`
- **Response:** `{ user_id, session_id, connection_id, device_id }`

### POST /api/bluesocket/send
Send a message or event.
- **Body:** `{ to_user_id, connection_id, payload, event_type? }`
- **Response:** `{ sync_status, message_id, timestamp }`

### GET /api/bluesocket/sync
Poll for new events.
- **Query:** `connection_id`, `last_sync_timestamp?`
- **Response:** `{ sync_status, server_timestamp, events: [] }`

### GET /api/bluesocket/presence
Get list of users and their online status.
- **Response:** `{ users: [{ user_id, username, status, last_seen }] }`

### POST /api/bluesocket/heartbeat
Lightweight connection update.
- **Body:** `{ connection_id }`
- **Response:** `{ status, server_timestamp }`

## Admin

### GET /api/admin/stats
Get system statistics and live activity.
- **Response:** `{ stats: {}, recent_activity: [], recent_logs: [] }`
