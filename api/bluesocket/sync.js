import { query } from '../_lib/db.js';
import { validateSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = validateSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { connection_id, last_sync_timestamp } = req.query;

  if (!connection_id) {
    return res.status(400).json({ error: 'connection_id is required' });
  }

  try {
    const server_timestamp = new Date().toISOString();

    // 1. Update connection last_sync
    await query('UPDATE connections SET last_sync = ? WHERE connection_id = ?', [server_timestamp, connection_id]);
    await query('UPDATE users SET last_seen = ? WHERE user_id = ?', [server_timestamp, session.user_id]);

    // 2. Fetch new events
    let events = [];
    if (last_sync_timestamp) {
      const eventResult = await query(
        'SELECT * FROM sync_events WHERE connection_id = ? AND timestamp > ? ORDER BY timestamp ASC',
        [connection_id, last_sync_timestamp]
      );
      events = eventResult.rows.map(row => ({
        ...row,
        payload: JSON.parse(row.payload)
      }));
    } else {
      // First sync or reset - maybe return some history or just empty
      events = [];
    }

    return res.status(200).json({
      sync_status: 'success',
      server_timestamp,
      events
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
