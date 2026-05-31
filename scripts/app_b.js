/**
 * BlueSocket App B - The Incrementor (Reactive / Long Polling)
 */

const BASE_URL = 'https://bluesocket-six.vercel.app/api';
const AUTH = { username: 'am3lue', password: '143anna' };

const colors = { reset: "\x1b[0m", app: "\x1b[35m", server: "\x1b[33m", success: "\x1b[32m", error: "\x1b[31m" };
const log = (msg) => console.log(`${colors.app}[APP_B]${colors.reset} ${msg}`);

let highestSeen = 0;
const processedMessages = new Set();

async function start() {
    log('Logging in...');
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(AUTH)
    });
    const { token, user } = await authRes.json();
    const userId = user.user_id;

    log('Registering connection...');
    const regRes = await fetch(`${BASE_URL}/bluesocket/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'NODE_APP_B', device_type: 'mobile' })
    });
    const { connection_id: connId } = await regRes.json();
    log(`Online (Reactive Mode). ConnID: ${connId}`);

    const sendNumber = async (num) => {
        log(`${colors.success}Sending: ${num}${colors.reset}`);
        await fetch(`${BASE_URL}/bluesocket/send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_user_id: userId,
                connection_id: connId,
                payload: { counter: num, sender: 'APP_B' }
            })
        });
    };

    log('Waiting for App A...');

    // --- REACTIVE LISTENER (No setInterval!) ---
    let lastSync = null;
    while (true) {
        log(`Waiting for next message (Long Polling)...`);
        const url = `${BASE_URL}/bluesocket/sync?connection_id=${connId}&wait=true${lastSync ? `&last_sync_timestamp=${lastSync}` : ''}`;
        
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            lastSync = data.server_timestamp;

            if (data.events) {
                for (const event of data.events) {
                    const msgId = event.payload.message_id;
                    const payload = event.payload.payload;

                    if (processedMessages.has(msgId)) continue;
                    processedMessages.add(msgId);

                    if (payload.sender === 'APP_A' && payload.counter > highestSeen) {
                        highestSeen = payload.counter;
                        log(`${colors.server}Received: ${payload.counter}${colors.reset}`);
                        
                        const nextNum = payload.counter + 1;
                        await new Promise(r => setTimeout(r, 1000));
                        await sendNumber(nextNum);
                    }
                }
            }
        } catch (err) {
            log('Sync error: ' + err.message);
            await new Promise(r => setTimeout(r, 2000)); // Sleep on error
        }
    }
}

start().catch(console.error);
