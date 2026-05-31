import { v4 as uuidv4 } from 'uuid';
import { query } from '../_lib/db.js';
import { validateSession } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = validateSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { device_id, device_type } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: 'device_id is required' });
  }

  try {
    // 1. Ensure device exists
    const deviceResult = await query('SELECT * FROM devices WHERE device_id = ?', [device_id]);
    if (deviceResult.rows.length === 0) {
      await query(
        'INSERT INTO devices (device_id, user_id, device_type) VALUES (?, ?, ?)',
        [device_id, session.user_id, device_type || 'web']
      );
    }

    // 2. Create connection
    const connection_id = `conn_${uuidv4().replace(/-/g, '')}`;
    await query(
      'INSERT INTO connections (connection_id, user_id, session_id, device_id) VALUES (?, ?, ?, ?)',
      [connection_id, session.user_id, session.session_id, device_id]
    );

    return res.status(200).json({
      user_id: session.user_id,
      session_id: session.session_id,
      connection_id: connection_id,
      device_id: device_id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
