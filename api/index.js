import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from './_lib/db.js';
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
      const { device_id } = req.body;
      const connection_id = `conn_${uuidv4().replace(/-/g, '')}`;
      await query('INSERT INTO connections (connection_id, user_id, session_id, device_id) VALUES (?, ?, ?, ?)', [connection_id, session.user_id, session.session_id, device_id || 'web']);
      return res.status(200).json({ user_id: session.user_id, session_id: session.session_id, connection_id, device_id });
    }

    if (path === '/bluesocket/join-group' && req.method === 'POST') {
      const { group_id } = req.body;
      await query('INSERT OR IGNORE INTO groups (group_id, name) VALUES (?, ?)', [group_id, group_id]);
      await query('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', [group_id, session.user_id]);
      return res.status(200).json({ status: 'success' });
    }

    if (path === '/bluesocket/send' && req.method === 'POST') {
      const { to_user_id, payload, event_type = 'message' } = req.body;
      const message_id = `msg_${uuidv4().replace(/-/g, '')}`;
      const timestamp = new Date().toISOString();
      const queries = [{
        sql: 'INSERT INTO messages (message_id, from_user_id, to_user_id, connection_id, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        args: [message_id, session.user_id, to_user_id, req.body.connection_id, JSON.stringify(payload), timestamp]
      }];

      const sqlBase = "INSERT INTO sync_events (user_id, connection_id, event_type, payload, timestamp) SELECT user_id, connection_id, ?, ?, ? FROM connections WHERE status = 'ACTIVE'";
      const payloadStr = JSON.stringify({ message_id, from_username: session.username, from_user_id: session.user_id, target: to_user_id.startsWith('GRP_') ? to_user_id : (to_user_id === 'COMMUNITY' ? 'COMMUNITY' : 'PRIVATE'), payload });
      
      if (to_user_id === 'COMMUNITY') {
        queries.push({ sql: sqlBase, args: [event_type, payloadStr, timestamp] });
      } else if (to_user_id.startsWith('GRP_')) {
        queries.push({ sql: sqlBase + " AND user_id IN (SELECT user_id FROM group_members WHERE group_id = ?)", args: [event_type, payloadStr, timestamp, to_user_id] });
      } else {
        queries.push({ sql: sqlBase + " AND user_id = ?", args: [event_type, payloadStr, timestamp, to_user_id] });
      }
      await transaction(queries);
      return res.status(200).json({ sync_status: 'success', message_id, timestamp });
    }

    if (path === '/bluesocket/sync' && req.method === 'GET') {
      const { connection_id, last_sync_timestamp, wait } = req.query;
      let attempts = 0, maxWait = wait === 'true' ? 8 : 1, events = [], startTime = last_sync_timestamp;
      while (attempts < maxWait) {
        if (!startTime) {
          const c = await query('SELECT created_at FROM connections WHERE connection_id = ?', [connection_id]);
          if (c.rows.length > 0) startTime = c.rows[0].created_at;
        }
        const evs = await query('SELECT * FROM sync_events WHERE connection_id = ? AND timestamp > ? ORDER BY timestamp ASC', [connection_id, startTime]);
        events = evs.rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
        const msgs = await query('SELECT * FROM messages WHERE to_user_id = ? AND timestamp > ? ORDER BY timestamp ASC', [session.user_id, startTime]);
        msgs.rows.forEach(m => {
          if (!events.some(e => e.payload.message_id === m.message_id)) {
            events.push({ event_id: m.message_id, event_type: 'message', timestamp: m.timestamp, payload: { message_id: m.message_id, from_user_id: m.from_user_id, target: 'PRIVATE', payload: JSON.parse(m.payload) } });
          }
        });
        if (events.length > 0 || wait !== 'true') break;
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
      }
      return res.status(200).json({ sync_status: 'success', server_timestamp: new Date().toISOString(), events });
    }

    if (path === '/bluesocket/presence' && req.method === 'GET') {
      const now = new Date(), tenSec = new Date(now - 10000).toISOString(), sixtySec = new Date(now - 60000).toISOString();
      const r = await query("SELECT user_id, username, last_seen, CASE WHEN last_seen > ? THEN 'ONLINE' WHEN last_seen > ? THEN 'AWAY' ELSE 'OFFLINE' END as status FROM users WHERE user_id != ?", [tenSec, sixtySec, session.user_id]);
      return res.status(200).json({ users: r.rows });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
