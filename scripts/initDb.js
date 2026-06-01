import { createClient } from '@libsql/client/http';
import dotenv from 'dotenv';

async function initDb() {
  // 1. Load Environment Variables first
  dotenv.config();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ Error: TURSO_DATABASE_URL is not defined in your .env file.');
    process.exit(1);
  }

  // Check for reset flag
  const shouldReset = process.argv.includes('--reset');

  // Ensure the URL uses https for the HTTP client if it was provided as libsql://
  const sanitizedUrl = url.startsWith('libsql://') ? url.replace('libsql://', 'https://') : url;

  console.log(`Connecting to: ${sanitizedUrl}`);

  const client = createClient({
    url: sanitizedUrl,
    authToken: authToken,
  });

  try {
    if (shouldReset) {
      console.log('⚠️ RESET FLAG DETECTED: Cleaning database...');
      
      const tables = [
        'group_members',
        'groups',
        'messages',
        'connections',
        'devices',
        'sessions',
        'users',
        'audit_logs'
      ];

      for (const table of tables) {
        process.stdout.write(`  Dropping table ${table}... `);
        await client.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log('✅');
      }
      console.log('✨ Database clean complete.');
    }

    console.log('🚀 Initializing BlueSockets Lean Database Schema...');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_type TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS connections (
        connection_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (session_id) REFERENCES sessions (session_id),
        FOREIGN KEY (device_id) REFERENCES devices (device_id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        connection_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'SENT',
        FOREIGN KEY (from_user_id) REFERENCES users (user_id),
        FOREIGN KEY (to_user_id) REFERENCES users (user_id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        group_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups (group_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      );
    `);

    // Create indices for performance scaling
    await client.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp);');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages (to_user_id);');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);');

    // Create a default group for the demo
    try {
        await client.execute("INSERT INTO groups (group_id, name) VALUES ('GRP_1', 'Community Group')");
        console.log('✅ Default group GRP_1 created.');
    } catch {
        // Ignore if exists
    }

    console.log('🎉 Database initialization complete.');
  } catch (error) {
    console.error('❌ Error during database operation:', error);
  } finally {
    client.close();
  }
}

initDb();
