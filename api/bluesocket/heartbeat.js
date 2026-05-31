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

  const { connection_id } = req.body;

  if (!connection_id) {
    return res.status(400).json({ error: 'connection_id is required' });
  }

  try {
    const server_timestamp = new Date().toISOString();

    await query('UPDATE connections SET last_sync = ? WHERE connection_id = ?', [server_timestamp, connection_id]);
    await query('UPDATE users SET last_seen = ? WHERE user_id = ?', [server_timestamp, session.user_id]);

    return res.status(200).json({
      status: 'success',
      server_timestamp
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
