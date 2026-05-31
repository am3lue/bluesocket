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

  const { connection_id, last_sync_timestamp, wait } = req.query;

  if (!connection_id) {
    return res.status(400).json({ error: 'connection_id is required' });
  }

  try {
    let server_timestamp = new Date().toISOString();
    let events = [];
    let startTime = last_sync_timestamp;

    // --- Long Polling Logic ---
    const maxWait = wait === 'true' ? 8 : 1; // Wait up to 8 seconds if requested
    let attempts = 0;

    while (attempts < maxWait) {
      server_timestamp = new Date().toISOString();
      if (!startTime) {
        const connResult = await query('SELECT created_at FROM connections WHERE connection_id = ?', [connection_id]);
        if (connResult.rows.length > 0) startTime = connResult.rows[0].created_at;
      }

      // 1. Fetch from sync_events
      const eventResult = await query(
        'SELECT * FROM sync_events WHERE connection_id = ? AND timestamp > ? ORDER BY timestamp ASC',
        [connection_id, startTime]
      );
      events = eventResult.rows.map(row => ({ ...row, payload: JSON.parse(row.payload) }));

      // 2. Deep Scan
      const messageResult = await query(
        'SELECT * FROM messages WHERE to_user_id = ? AND timestamp > ? ORDER BY timestamp ASC',
        [session.user_id, startTime]
      );
      messageResult.rows.forEach(msg => {
        if (!events.some(e => e.payload.message_id === msg.message_id)) {
          events.push({
            event_id: `msg_${msg.message_id}`,
            user_id: session.user_id,
            connection_id: connection_id,
            event_type: 'message',
            payload: { message_id: msg.message_id, from_user_id: msg.from_user_id, payload: JSON.parse(msg.payload) },
            timestamp: msg.timestamp
          });
        }
      });

      if (events.length > 0 || wait !== 'true') break;
      
      // No data yet, wait 1 second and try again
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    // Update connection status
    await query('UPDATE connections SET last_sync = ? WHERE connection_id = ?', [server_timestamp, connection_id]);
    await query('UPDATE users SET last_seen = ? WHERE user_id = ?', [server_timestamp, session.user_id]);

    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
