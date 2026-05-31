import { createClient } from '@libsql/client/http';

let client;

export function getDbClient() {
  if (!client) {
    // Ensure the URL uses https for the HTTP client if it was provided as libsql://
    let url = process.env.TURSO_DATABASE_URL;
    if (url && url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://');
    }

    client = createClient({
      url: url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function query(sql, params = []) {
  const db = getDbClient();
  return await db.execute({ sql, args: params });
}

export async function transaction(queries) {
  const db = getDbClient();
  const tx = await db.transaction();
  try {
    const results = [];
    for (const q of queries) {
      results.push(await tx.execute(q));
    }
    await tx.commit();
    return results;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
