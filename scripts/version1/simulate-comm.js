/**
 * BlueSocket Verbose App-to-App Simulation
 * This script simulates two independent apps (App A and App B) 
 * communicating through your live Vercel endpoint.
 */

const BASE_URL = 'https://bluesoket.vercel.app/api';
const AUTH = { username: 'am3lue', password: '143anna' };

// ANSI Color codes for verbose terminal logging
const colors = {
    reset: "\x1b[0m",
    appA: "\x1b[36m", // Cyan
    appB: "\x1b[35m", // Magenta
    server: "\x1b[33m", // Yellow
    success: "\x1b[32m", // Green
    info: "\x1b[90m" // Gray
};

const log = (app, msg) => {
    const time = new Date().toLocaleTimeString();
    const color = app === 'APP_A' ? colors.appA : (app === 'APP_B' ? colors.appB : colors.server);
    console.log(`${colors.info}[${time}]${colors.reset} ${color}[${app}]${colors.reset} ${msg}`);
};

async function runSimulation() {
    console.log(`${colors.success}=== BlueSocket Protocol Verbose Mode ===${colors.reset}\n`);

    // 1. SHARED AUTHENTICATION
    log('SYSTEM', 'Attempting shared authentication...');
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(AUTH)
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error('Auth failed: ' + JSON.stringify(authData));
    
    const token = authData.token;
    const userId = authData.user.user_id;
    log('SYSTEM', `Auth successful. Token acquired for User: ${userId}`);

    // 2. REGISTER APP A
    log('APP_A', 'Registering connection...');
    const regARes = await fetch(`${BASE_URL}/bluesocket/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'NODE_APP_A', device_type: 'desktop' })
    });
    const { connection_id: connA } = await regARes.json();
    log('APP_A', `Online. ConnectionID: ${connA}`);

    // 3. REGISTER APP B
    log('APP_B', 'Registering connection...');
    const regBRes = await fetch(`${BASE_URL}/bluesocket/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'NODE_APP_B', device_type: 'mobile_sim' })
    });
    const { connection_id: connB } = await regBRes.json();
    log('APP_B', `Online. ConnectionID: ${connB}`);

    console.log('\n--- Starting Live Communication ---');

    // 4. APP B START SYNC LOOP (Simulated Background Process)
    let bLastSync = null;
    const appBSyncLoop = setInterval(async () => {
        log('APP_B', `Checking mailbox (Last sync: ${bLastSync || 'Never'})...`);
        const url = `${BASE_URL}/bluesocket/sync?connection_id=${connB}${bLastSync ? `&last_sync_timestamp=${bLastSync}` : ''}`;
        
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.events && data.events.length > 0) {
                log('APP_B', `📦 RECEIVED ${data.events.length} NEW EVENT(S)!`);
                data.events.forEach(e => {
                    console.log(`       ${colors.appB}>> Data:${colors.reset}`, JSON.stringify(e.payload));
                });
            }
            bLastSync = data.server_timestamp;
        } catch (err) {
            log('APP_B', 'Sync error: ' + err.message);
        }
    }, 3000); // Check every 3 seconds

    // 5. APP A SEND MESSAGES (Simulated User Action)
    const sendData = async (msg) => {
        log('APP_A', `Sending data package: "${msg}"`);
        const res = await fetch(`${BASE_URL}/bluesocket/send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_user_id: userId,
                connection_id: connA,
                payload: { content: msg, type: 'command' }
            })
        });
        const data = await res.json();
        log('APP_A', `Server acknowledged. MessageID: ${data.message_id}`);
    };

    // Simulate sending messages at intervals
    setTimeout(() => sendData("HELLO_FROM_APP_A"), 2000);
    setTimeout(() => sendData("TRIGGER_ALARM_CLOCK"), 8000);
    setTimeout(() => sendData("SYSTEM_SHUTDOWN_TEST"), 14000);

    // Stop after 20 seconds
    setTimeout(() => {
        clearInterval(appBSyncLoop);
        console.log(`\n${colors.success}=== Simulation Finished ===${colors.reset}`);
        process.exit(0);
    }, 20000);
}

runSimulation().catch(err => {
    console.error(`${colors.error}FATAL ERROR: ${err.message}${colors.reset}`);
});
