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

  const { to_user_id, type = 'info', payload } = req.body;

  if (!to_user_id || !payload) {
    return res.status(400).json({ error: 'to_user_id and payload are required' });
  }

  try {
    const notification_id = `notif_${uuidv4().replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    // Store in notifications table AND create sync events for all active connections of that user
    await transaction([
      {
        sql: 'INSERT INTO notifications (notification_id, user_id, type, payload) VALUES (?, ?, ?, ?)',
        args: [notification_id, to_user_id, type, JSON.stringify(payload)]
      },
      {
        sql: "INSERT INTO sync_events (user_id, connection_id, event_type, payload, timestamp) SELECT user_id, connection_id, 'notification', ?, ? FROM connections WHERE user_id = ? AND status = 'ACTIVE'",
        args: [JSON.stringify({ notification_id, type, payload }), timestamp, to_user_id]
      }
    ]);

    return res.status(200).json({
      status: 'success',
      notification_id,
      timestamp
    });
  } catch (error) {
    console.error('Notification send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
