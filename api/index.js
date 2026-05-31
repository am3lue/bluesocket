import { v4 as uuidv4 } from 'uuid';
import { query } from './_lib/db.js';
import { generateToken, validateSession } from './_lib/auth.js';
import { setCorsHeaders } from './_lib/cors.js';

export default async function handler(req, res) {
  // 1. Handle CORS
  if (setCorsHeaders(req, res)) return;

  // 2. Simple Router
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  try {
    // --- AUTH ROUTES ---
    if (path === '/auth/login' && req.method === 'POST') {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
      
      const userResult = await query('SELECT * FROM users WHERE username = ?', [username]);
      let user = userResult.rows[0];
      if (!user) {
        const user_id = `usr_${uuidv4().replace(/-/g, '')}`;
        await query('INSERT INTO users (user_id, username, password_hash) VALUES (?, ?, ?)', [user_id, username, password]);
        user = { user_id, username };
      } else if (user.password_hash !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const session_id = `sess_${uuidv4().replace(/-/g, '')}`;
      await query('INSERT INTO sessions (session_id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)', [session_id, user.user_id, 'token', new Date(Date.now() + 3600000).toISOString()]);
      const token = generateToken({ user_id: user.user_id, username: user.username, session_id });
      return res.status(200).json({ token, user: { user_id: user.user_id, username: user.username, session_id } });
    }

    // --- PROTECTED ROUTES ---
    const session = validateSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    if (path === '/bluesocket/register' && req.method === 'POST') {
      const { device_id, device_type } = req.body;
      const connection_id = `conn_${uuidv4().replace(/-/g, '')}`;
      
      // Ensure device exists first (FOREIGN KEY requirement)
      await query('INSERT OR IGNORE INTO devices (device_id, user_id, device_type) VALUES (?, ?, ?)', [device_id || 'web_default', session.user_id, device_type || 'web']);
      
      await query('INSERT INTO connections (connection_id, user_id, session_id, device_id) VALUES (?, ?, ?, ?)', [connection_id, session.user_id, session.session_id, device_id || 'web_default']);
      return res.status(200).json({ user_id: session.user_id, session_id: session.session_id, connection_id, device_id: device_id || 'web_default' });
    }

    if (path === '/bluesocket/join-group' && req.method === 'POST') {
      const { group_id } = req.body;
      await query('INSERT OR IGNORE INTO groups (group_id, name) VALUES (?, ?)', [group_id, group_id]);
      await query('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', [group_id, session.user_id]);
      return res.status(200).json({ status: 'success' });
    }

    if (path === '/bluesocket/send' && req.method === 'POST') {
      const { to_username, payload, message_id: client_message_id } = req.body;
      const message_id = client_message_id || `msg_${uuidv4().replace(/-/g, '')}`;
      const timestamp = new Date().toISOString();

      // 1. Idempotency Check
      const existing = await query('SELECT status, timestamp FROM messages WHERE message_id = ?', [message_id]);
      if (existing.rows.length > 0) {
        return res.status(200).json({ sync_status: 'already_exists', message_id, timestamp: existing.rows[0].timestamp });
      }

      // 2. Resolve or Create Target User
      let to_user_id;
      const userRes = await query('SELECT user_id FROM users WHERE username = ?', [to_username]);
      if (userRes.rows.length > 0) {
        to_user_id = userRes.rows[0].user_id;
      } else {
        to_user_id = `usr_${uuidv4().replace(/-/g, '')}`;
        await query('INSERT INTO users (user_id, username, password_hash) VALUES (?, ?, ?)', [to_user_id, to_username, 'auto_generated']);
      }
      
      // 3. Insert with 'SENT' status and return immediately
      await query('INSERT INTO messages (message_id, from_user_id, to_user_id, connection_id, payload, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [message_id, session.user_id, to_user_id, req.body.connection_id || 'default', JSON.stringify(payload), timestamp, 'SENT']);

      return res.status(201).json({ sync_status: 'sent', message_id, timestamp });
    }

    if (path === '/bluesocket/sync' && req.method === 'GET') {
      const { connection_id, last_sync_timestamp } = req.query;
      let events = [];
      let startTime = last_sync_timestamp;

      if (!startTime) {
        const c = await query('SELECT created_at FROM connections WHERE connection_id = ?', [connection_id]);
        if (c.rows.length > 0) startTime = c.rows[0].created_at;
        else startTime = new Date(0).toISOString();
      }

      // Single Database Check (No loop)
      const msgs = await query(`
        SELECT m.*, u.username as from_username 
        FROM messages m
        JOIN users u ON m.from_user_id = u.user_id
        WHERE m.timestamp > ? 
        AND (
          m.to_user_id = 'COMMUNITY' 
          OR m.to_user_id = ? 
          OR m.to_user_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        )
        ORDER BY m.timestamp ASC
      `, [startTime, session.user_id, session.user_id]);

      if (msgs.rows.length > 0) {
        events = msgs.rows.map(m => {
          const targetType = m.to_user_id === 'COMMUNITY' ? 'COMMUNITY' : (m.to_user_id.startsWith('GRP_') ? m.to_user_id : 'PRIVATE');
          return {
            event_id: m.message_id,
            event_type: 'message',
            timestamp: m.timestamp,
            payload: {
              message_id: m.message_id,
              from_username: m.from_username,
              from_user_id: m.from_user_id,
              target: targetType,
              payload: JSON.parse(m.payload)
            }
          };
        });

        // Update status to 'DELIVERED' but DO NOT DELETE
        const privateMsgIds = msgs.rows
          .filter(m => m.to_user_id === session.user_id && m.status === 'SENT')
          .map(m => m.message_id);
        
        if (privateMsgIds.length > 0) {
          const placeholders = privateMsgIds.map(() => '?').join(',');
          await query(`UPDATE messages SET status = 'DELIVERED' WHERE message_id IN (${placeholders})`, privateMsgIds);
        }
      }

      return res.status(200).json({ 
        sync_status: events.length > 0 ? 'new_messages' : 'empty', 
        server_timestamp: new Date().toISOString(), 
        events 
      });
    }

    if (path === '/bluesocket/presence' && req.method === 'GET') {
      const now = new Date(), tenSec = new Date(now - 10000).toISOString(), sixtySec = new Date(now - 60000).toISOString();
      const r = await query("SELECT user_id, username, last_seen, CASE WHEN last_seen > ? THEN 'ONLINE' WHEN last_seen > ? THEN 'AWAY' ELSE 'OFFLINE' END as status FROM users WHERE user_id != ?", [tenSec, sixtySec, session.user_id]);
      return res.status(200).json({ users: r.rows });
    }

    if (path === '/bluesocket/resolve' && req.method === 'POST') {
      const { usernames } = req.body; // Expects an array of usernames
      if (!usernames || !Array.isArray(usernames)) return res.status(400).json({ error: 'usernames array required' });
      
      const placeholders = usernames.map(() => '?').join(',');
      const r = await query(`SELECT user_id, username FROM users WHERE username IN (${placeholders})`, usernames);
      
      const resolutionMap = {};
      r.rows.forEach(row => { resolutionMap[row.username] = row.user_id; });
      return res.status(200).json({ resolved: resolutionMap });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
