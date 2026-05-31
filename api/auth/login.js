import { v4 as uuidv4 } from 'uuid';
import { query } from '../_lib/db.js';
import { generateToken } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Simple prototype logic: if user exists, check password (plaintext for prototype, use bcrypt in prod)
    // If user doesn't exist, create user.
    const userResult = await query('SELECT * FROM users WHERE username = ?', [username]);
    let user = userResult.rows[0];

    if (!user) {
      const user_id = `usr_${uuidv4().replace(/-/g, '')}`;
      await query(
        'INSERT INTO users (user_id, username, password_hash) VALUES (?, ?, ?)',
        [user_id, username, password] // Store plaintext for now as requested for a simple deliverable, but noted in docs as insecurity
      );
      user = { user_id, username };
    } else {
      if (user.password_hash !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const session_id = `sess_${uuidv4().replace(/-/g, '')}`;
    const expires_at = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await query(
      'INSERT INTO sessions (session_id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
      [session_id, user.user_id, 'refresh_token_placeholder', expires_at]
    );

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      session_id: session_id
    });

    return res.status(200).json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        session_id: session_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
