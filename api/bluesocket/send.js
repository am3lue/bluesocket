import { v4 as uuidv4 } from 'uuid';
import { transaction } from '../_lib/db.js';
import { validateSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = validateSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to_user_id, connection_id, payload, event_type = 'message' } = req.body;

  if (!to_user_id || !connection_id || !payload) {
    return res.status(400).json({ error: 'to_user_id, connection_id, and payload are required' });
  }

  try {
    const message_id = `msg_${uuidv4().replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    // Store message and create sync events for both sender (for sync acknowledgement) and receiver
    await transaction([
      {
        sql: 'INSERT INTO messages (message_id, from_user_id, to_user_id, connection_id, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        args: [message_id, session.user_id, to_user_id, connection_id, JSON.stringify(payload), timestamp]
      },
      // Event for receiver - only target the most recent active connection
      {
        sql: "INSERT INTO sync_events (user_id, connection_id, event_type, payload, timestamp) SELECT user_id, connection_id, ?, ?, ? FROM connections WHERE user_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1",
        args: [event_type, JSON.stringify({ message_id, from_user_id: session.user_id, payload }), timestamp, to_user_id]
      }
    ]);

    return res.status(200).json({
      sync_status: 'success',
      message_id,
      timestamp
    });
  } catch (error) {
    console.error('Send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
