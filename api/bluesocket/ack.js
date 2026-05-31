import { query } from '../_lib/db.js';
import { validateSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = validateSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { connection_id, event_ids } = req.body;

  if (!connection_id || !event_ids || !Array.isArray(event_ids)) {
    return res.status(400).json({ error: 'connection_id and event_ids (array) are required' });
  }

  try {
    // In this protocol, we could delete acknowledged events or mark them.
    // For simplicity, we'll just log the acknowledgement in the audit logs.
    await query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [session.user_id, 'ACK', `Acknowledged events: ${event_ids.join(', ')}`]
    );

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Ack error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
