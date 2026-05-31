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

  const { group_id } = req.body;

  if (!group_id) {
    return res.status(400).json({ error: 'group_id is required' });
  }

  try {
    // 1. Ensure group exists
    const groupResult = await query('SELECT * FROM groups WHERE group_id = ?', [group_id]);
    if (groupResult.rows.length === 0) {
      // Auto-create group for this realistic demo
      await query('INSERT INTO groups (group_id, name) VALUES (?, ?)', [group_id, `Group ${group_id.replace('GRP_', '')}`]);
    }

    // 2. Add member (using INSERT OR IGNORE logic)
    await query(
      'INSERT INTO group_members (group_id, user_id) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)',
      [group_id, session.user_id, group_id, session.user_id]
    );

    return res.status(200).json({ status: 'success', message: `Joined ${group_id}` });
  } catch (error) {
    console.error('Join group error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
