/**
 * BlueSocket App A - The Starter
 * Sends a number, waits for App B to increment it and send it back.
 */

const BASE_URL = 'https://bluesocket-six.vercel.app/api';
const AUTH = { username: 'am3lue', password: '143Anna' };

const colors = { reset: "\x1b[0m", app: "\x1b[36m", server: "\x1b[33m", success: "\x1b[32m", error: "\x1b[31m" };
const log = (msg) => console.log(`${colors.app}[APP_A]${colors.reset} ${msg}`);

async function start() {
    log('Logging in...');
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(AUTH)
    });
    
    const authData = await authRes.json();
    
    if (!authRes.ok) {
        console.log(`${colors.error}[APP_A] AUTH FAILED: ${authData.error || 'Unknown error'}${colors.reset}`);
        process.exit(1);
    }

    const userId = authData.user.user_id;
    const token = authData.token;

    log('Registering connection...');
    const regRes = await fetch(`${BASE_URL}/bluesocket/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'NODE_APP_A', device_type: 'desktop' })
    });
    const { connection_id: connId } = await regRes.json();
    log(`Online. ConnID: ${connId}`);

    const sendNumber = async (num) => {
        log(`${colors.success}Sending: ${num}${colors.reset}`);
        await fetch(`${BASE_URL}/bluesocket/send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_user_id: userId,
                connection_id: connId,
                payload: { counter: num, sender: 'APP_A' }
            })
        });
    };

    // Start the game by sending 1
    setTimeout(() => sendNumber(1), 1000);

    // Sync loop to listen for App B's response
    let lastSync = null;
    setInterval(async () => {
        const url = `${BASE_URL}/bluesocket/sync?connection_id=${connId}${lastSync ? `&last_sync_timestamp=${lastSync}` : ''}`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        lastSync = data.server_timestamp;

        data.events?.forEach(event => {
            const payload = event.payload.payload;
            if (payload.sender === 'APP_B') {
                log(`${colors.server}Received from APP_B: ${payload.counter}${colors.reset}`);
                const nextNum = payload.counter + 1;
                log(`Incrementing to ${nextNum}...`);
                sendNumber(nextNum);
            }
        });
    }, 2000);
}

start().catch(console.error);
