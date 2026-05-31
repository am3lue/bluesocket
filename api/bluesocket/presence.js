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

  try {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000).toISOString();
    const sixtySecondsAgo = new Date(now.getTime() - 60000).toISOString();

    const usersResult = await query(`
      SELECT user_id, username, last_seen,
      CASE 
        WHEN last_seen > ? THEN 'ONLINE'
        WHEN last_seen > ? THEN 'AWAY'
        ELSE 'OFFLINE'
      END as status
      FROM users
      WHERE user_id != ?
    `, [tenSecondsAgo, sixtySecondsAgo, session.user_id]);

    return res.status(200).json({
      users: usersResult.rows
    });
  } catch (error) {
    console.error('Presence error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
