# 🛠️ BlueSocket v3 Setup Guide

Follow these steps to get your own instance of the BlueSocket stateless real-time protocol running.

## 📋 Prerequisites

1.  **Node.js**: Version 18 or higher.
2.  **Turso Database**: A free account at [turso.tech](https://turso.tech).
3.  **Vercel Account**: For hosting the API and Frontend.

---

## 1. Environment Configuration

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/bluesocket.git
    cd bluesocket
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Create `.env` File**:
    Copy the example template:
    ```bash
    cp .env.example .env
    ```

4.  **Fill in Credentials**:
    Open `.env` and provide your Turso database details and a secret for JWT:
    - `TURSO_DATABASE_URL`: Your Turso DB URL (e.g., `libsql://your-db.turso.io`).
    - `TURSO_AUTH_TOKEN`: Your Turso API Token.
    - `JWT_SECRET`: A long, random string (e.g., `openssl rand -base64 32`).

---

## 2. Database Initialization

BlueSocket uses a stateless SQLite schema. You must initialize it before first use.

1.  **Run Initializer**:
    ```bash
    node scripts/initDb.js
    ```

2.  **Verify Setup**:
    The script should output `🎉 Database initialization complete.`

3.  **Reset (Optional)**:
    If you ever want to wipe all data and start fresh:
    ```bash
    node scripts/initDb.js --reset
    ```

---

## 3. Local Development

You can run both the API and the Vue 3 dashboard locally.

1.  **Start Development Server**:
    ```bash
    npm run dev
    ```

2.  **Access Dashboard**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

3.  **Test the API**:
    The API runs locally at `http://localhost:3000/api` (if using `vercel dev`) or via the Vite proxy.

---

## 4. Deployment

### Deploying to Vercel

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```

2.  **Deploy**:
    ```bash
    vercel
    ```

3.  **Set Environment Variables**:
    Make sure to add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `JWT_SECRET` in the Vercel Dashboard under **Settings > Environment Variables**.

4.  **Production Push**:
    ```bash
    vercel --prod
    ```

---

## 5. Live Testing (Simulation)

Once your API is live (or running locally), you can test the protocol using the provided simulations:

1.  Navigate to `scripts/version3/`.
2.  Open `phone_a.html`, `phone_b.html`, `phone_c.html`, and `phone_d.html` in separate browser windows.
3.  Log in as **App A**, **App B**, etc.
4.  Observe the 3-way handshake and real-time message synchronization.

---

**You're all set!** 🚀 If you run into issues, check [docs/troubleshooting.md](./troubleshooting.md).
