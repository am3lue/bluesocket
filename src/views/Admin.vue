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
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.terminal {
  flex: 1;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
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
</style>
