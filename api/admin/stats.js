import { query } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In a real app, we'd check for admin role here
  
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const activeConnections = await query('SELECT COUNT(*) as count FROM connections WHERE last_sync > ?', [
      new Date(Date.now() - 60000).toISOString()
    ]);
    const messageCount = await query('SELECT COUNT(*) as count FROM messages');
    
    // Get recent audit logs for the "live stream" feel
    const recentEvents = await query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20');
    
    // Also get recent sync events to show activity
    const activity = await query(`
      SELECT s.timestamp, u.username, s.event_type 
      FROM sync_events s
      JOIN users u ON s.user_id = u.user_id
      ORDER BY s.timestamp DESC LIMIT 10
    `);

    return res.status(200).json({
      stats: {
        users: userCount.rows[0].count,
        active_connections: activeConnections.rows[0].count,
        total_messages: messageCount.rows[0].count
      },
      recent_activity: activity.rows,
      recent_logs: recentEvents.rows
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
