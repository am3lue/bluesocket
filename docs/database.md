# BlueSocket Database Schema

The database uses SQLite (via Turso/libsql).

## Tables

### users
- `user_id`: Primary Key
- `username`: Unique username
- `password_hash`: Password (plaintext in prototype)
- `created_at`: Timestamp
- `last_seen`: Last sync/heartbeat timestamp

### sessions
- `session_id`: Primary Key
- `user_id`: Foreign Key to users
- `refresh_token`: Token for session renewal
- `expires_at`: Expiration timestamp

### devices
- `device_id`: Primary Key
- `user_id`: Foreign Key to users
- `device_type`: web, mobile, etc.

### connections
- `connection_id`: Primary Key
- `user_id`: Foreign Key to users
- `session_id`: Foreign Key to sessions
- `device_id`: Foreign Key to devices
- `status`: ACTIVE, INACTIVE
- `last_sync`: Timestamp of last sync

### messages
- `message_id`: Primary Key
- `from_user_id`: Foreign Key to users
- `to_user_id`: Foreign Key to users
- `payload`: JSON stringified content
- `timestamp`: Creation time

### sync_events
- `event_id`: Auto-increment Primary Key
- `user_id`: Recipient user ID
- `connection_id`: Recipient connection ID
- `event_type`: message, notification, etc.
- `payload`: JSON data
- `timestamp`: Event creation time
