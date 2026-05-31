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

  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: 'notification_id is required' });
  }

  try {
    await query('UPDATE notifications SET read_status = 1 WHERE notification_id = ? AND user_id = ?', [
      notification_id,
      session.user_id
    ]);

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
