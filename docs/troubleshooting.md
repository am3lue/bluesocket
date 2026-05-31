# Troubleshooting

## Common Issues

### 1. Database Connection Errors
- **Error:** `LibsqlError: URL_INVALID` or native binding errors on Vercel.
- **Solution:** BlueSocket uses the `@libsql/client/http` package to ensure compatibility with Vercel serverless functions. Ensure your `TURSO_DATABASE_URL` starts with `https://` (the code automatically converts `libsql://` to `https://` for you).

### 2. Authentication Failures
- **Error:** `401 Unauthorized`
- **Solution:** Ensure your `JWT_SECRET` is consistent between restarts. Clear your browser's LocalStorage if you suspect a stale token.

### 3. Sync Latency
- **Issue:** Messages taking too long to appear.
- **Solution:** Check the `syncInterval` in `src/services/bluesocket.js`. Default is 2000ms. Lowering it increases "real-time" feel but increases server load.

### 4. Vercel Functions Timeout
- **Issue:** API requests taking > 10s.
- **Solution:** Turso is usually fast, but ensure your database region matches your Vercel function region (e.g., `iad1` or `sfo1`).
