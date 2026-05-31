<template>
  <div class="admin-view">
    <div class="monitor-grid">
      <!-- Top Stats Bar -->
      <div class="stats-bar glass">
        <div class="stat-card">
          <span class="label">USERS</span>
          <span class="value">{{ stats.users }}</span>
        </div>
        <div class="stat-card highlight">
          <span class="label">ACTIVE CONNS</span>
          <span class="value">{{ stats.active_connections }}</span>
        </div>
        <div class="stat-card">
          <span class="label">TOTAL MSGS</span>
          <span class="value">{{ stats.total_messages }}</span>
        </div>
        <div class="system-status">
          <div class="pulse-dot"></div>
          LIVE PROTOCOL
        </div>
      </div>

      <!-- Main Terminal Section -->
      <div class="main-content-row">
        <div class="terminal glass">
          <div class="terminal-header">
            <div class="header-left">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
              <span class="terminal-title">system@bluesocket: ~</span>
            </div>
            <div class="header-right">
              v1.0.0 — STATELESS_MODE
            </div>
          </div>
          
          <div class="terminal-body" ref="terminalBody">
            <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
              <span class="ts">[{{ formatTime(log.timestamp) }}]</span>
              <span class="p" v-if="log.type === 'command'">$</span>
              <span class="txt">{{ log.message }}</span>
            </div>
          </div>
          
          <div class="terminal-footer">
            <span class="prompt">➜</span>
            <input 
              type="text" 
              v-model="command" 
              @keyup.enter="handleCommand" 
              placeholder="Enter system command (help for list)..." 
              class="command-input"
            />
          </div>
        </div>

        <!-- Documentation Sidebar -->
        <div class="docs-sidebar glass">
          <div class="docs-header">
            <h3>📖 DOCS</h3>
          </div>
          <div class="docs-links">
            <a href="/docs/README.md" target="_blank" class="doc-link">
              <span class="icon">🚀</span> Intro
            </a>
            <a href="/docs/architecture.md" target="_blank" class="doc-link">
              <span class="icon">🏛️</span> Logic
            </a>
            <a href="/docs/usage-guide.md" target="_blank" class="doc-link">
              <span class="icon">📲</span> Guide
            </a>
            <a href="/docs/security.md" target="_blank" class="doc-link">
              <span class="icon">🛡️</span> Security
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { api } from '../services/api';

const stats = ref({
  users: 0,
  active_connections: 0,
  total_messages: 0
});

const logs = ref([]);
const command = ref('');
const terminalBody = ref(null);

const formatTime = (ts) => {
  const date = ts ? new Date(ts) : new Date();
  return date.toLocaleTimeString();
};

const fetchStats = async () => {
  try {
    const data = await api.get('/admin/stats');
    stats.value = data.stats;
    
    // Add new activity to logs
    data.recent_activity.forEach(act => {
      const msg = `${act.username.toUpperCase()} -> ${act.event_type}`;
      if (!logs.value.some(l => l.message === msg && l.timestamp === act.timestamp)) {
        logs.value.push({
          timestamp: act.timestamp,
          message: msg,
          type: 'activity'
        });
      }
    });

    // Add logs
    data.recent_logs.forEach(l => {
      const msg = `${l.action}: ${l.details || ''}`;
      if (!logs.value.some(log => log.message === msg && log.timestamp === l.timestamp)) {
        logs.value.push({
          timestamp: l.timestamp,
          message: msg,
          type: 'log'
        });
      }
    });

    // Sort by timestamp
    logs.value.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Limit to 100 logs
    if (logs.value.length > 100) {
      logs.value = logs.value.slice(-100);
    }

    scrollToBottom();
  } catch (err) {
    console.error('Failed to fetch admin stats', err);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
};

const sendSystemNotification = async (userId, message) => {
  try {
    await api.post('/bluesocket/notify', {
      to_user_id: userId,
      type: 'info',
      payload: { message }
    });
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: `SUCCESS: Notification dispatched to ${userId}`,
      type: 'info'
    });
  } catch (err) {
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: `ERROR: Failed to dispatch: ${err.message}`,
      type: 'error'
    });
  }
};

const handleCommand = () => {
  if (!command.value) return;
  const rawCmd = command.value;
  
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: rawCmd,
    type: 'command'
  });
  
  if (rawCmd === 'clear') {
    logs.value = [];
  } else if (rawCmd === 'help') {
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: 'CORE_CMD: clear, help, stats, users, notify [user_id] [message]',
      type: 'info'
    });
  } else if (rawCmd.startsWith('notify')) {
    const parts = rawCmd.split(' ');
    if (parts.length >= 3) {
      const targetUserId = parts[1];
      const message = parts.slice(2).join(' ');
      sendSystemNotification(targetUserId, message);
    } else {
      logs.value.push({
        timestamp: new Date().toISOString(),
        message: 'USAGE: notify [user_id] [message]',
        type: 'error'
      });
    }
  } else {
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: `UNKNOWN_CMD: ${rawCmd}`,
      type: 'error'
    });
  }
  
  command.value = '';
  scrollToBottom();
};

let interval = null;

onMounted(() => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: 'KERNEL: BlueSocket monitoring subsystem active.',
    type: 'info'
  });
  
  fetchStats();
  interval = setInterval(fetchStats, 3000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.admin-view {
  height: 100%;
  padding: 1.5rem;
  background-image: linear-gradient(rgba(0, 168, 255, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 168, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  overflow-y: auto;
}

@media (max-width: 600px) {
  .admin-view {
    padding: 1rem;
  }
}

.monitor-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-bar {
  display: flex;
  padding: 1.5rem;
  gap: 2rem;
  align-items: center;
  border-radius: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .stats-bar {
    gap: 1rem;
    padding: 1rem;
  }
  .system-status {
    width: 100%;
    justify-content: center;
    order: -1;
    margin-left: 0 !important;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 120px;
}

@media (max-width: 480px) {
  .stat-card {
    min-width: 100%;
    align-items: center;
    text-align: center;
  }
}

.stat-card .label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.stat-card .value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: var(--text-main);
}

.stat-card.highlight .value {
  color: var(--primary);
  text-shadow: 0 0 10px var(--primary-glow);
}

.system-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid var(--border);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.main-content-row {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 400px;
}

@media (max-width: 900px) {
  .main-content-row {
    flex-direction: column;
  }
}

.terminal {
  flex: 3;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.docs-sidebar {
  flex: 1;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
}

.docs-header h3 {
  font-size: 0.85rem;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin: 0;
}

.docs-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.doc-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.doc-link:hover {
  background: rgba(0, 168, 255, 0.1);
  border-color: var(--primary);
  transform: translateX(5px);
}

.doc-link .icon {
  font-size: 1.1rem;
}

.terminal-header {
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .header-right {
    display: none;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.red { background: #ff5f56; }
.yellow { background: #ffbd2e; }
.green { background: #27c93f; }

.terminal-title {
  margin-left: 0.5rem;
  color: var(--text-dim);
  font-family: 'Fira Code', monospace;
}

.header-right {
  font-weight: 600;
  color: var(--text-dim);
  font-size: 0.75rem;
}

.terminal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .terminal-body {
    padding: 1rem;
    font-size: 0.8rem;
  }
}

.log-entry {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.75rem;
}

.ts { color: var(--text-dim); flex-shrink: 0; }
.p { color: var(--primary); font-weight: bold; }
.txt { word-break: break-all; }

.activity { color: #82aaff; }
.log { color: #f78c6c; }
.command { color: #c3e88d; }
.info { color: #c792ea; }
.error { color: var(--error); }

.terminal-footer {
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prompt {
  color: var(--primary);
  font-weight: bold;
}

.command-input {
  background: transparent;
  border: none;
  color: var(--text-main);
  flex: 1;
  font-family: 'Fira Code', monospace;
  font-size: 1rem;
  outline: none;
}

@media (max-width: 480px) {
  .command-input {
    font-size: 0.9rem;
  }
}

</style>
