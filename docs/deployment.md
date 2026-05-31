# Deployment Guide

## Vercel Deployment

BlueSocket is optimized for Vercel.

1. **Connect Repository:** Link your Git repo to Vercel.
2. **Configure Environment Variables:**
   - `TURSO_DATABASE_URL`: Your Turso DB URL.
   - `TURSO_AUTH_TOKEN`: Your Turso Auth Token.
   - `JWT_SECRET`: A long random string.
3. **Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy:** Hit deploy.

### 📝 SPA Routing Note
The project includes a `vercel.json` file that handles Single Page Application (SPA) routing. This ensures that refreshing the page on any sub-route (like `/chat` or `/admin`) correctly redirects to `index.html` instead of giving a 404 error.

## Database Migration
After deployment, or locally, run the init script to set up tables:
```bash
node scripts/initDb.js
```
*Note: Ensure your local `.env` has the production Turso credentials if running locally against the production DB.*
