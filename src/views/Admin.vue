<template>
  <div class="admin-view">
    <div class="terminal">
      <div class="terminal-header">
        <span>BLUESOCKET MONITOR v1.0.0</span>
        <div class="stats">
          <span>USERS: {{ stats.users }}</span>
          <span>CONNS: {{ stats.active_connections }}</span>
          <span>MSGS: {{ stats.total_messages }}</span>
        </div>
      </div>
      <div class="terminal-body" ref="terminalBody">
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
          <span class="timestamp">[{{ formatTime(log.timestamp) }}]</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
      <div class="terminal-footer">
        <span class="prompt">></span>
        <input type="text" v-model="command" @keyup.enter="handleCommand" placeholder="Enter command..." />
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
      const msg = `${act.username} -> ${act.event_type}`;
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
      message: `Notification sent to ${userId}`,
      type: 'info'
    });
  } catch (err) {
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: `Failed to send notification: ${err.message}`,
      type: 'error'
    });
  }
};

const handleCommand = () => {
  if (!command.value) return;
  
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: `Executing: ${command.value}...`,
    type: 'command'
  });
  
  if (command.value === 'clear') {
    logs.value = [];
  } else if (command.value === 'help') {
    logs.value.push({
      timestamp: new Date().toISOString(),
      message: 'Available commands: clear, help, stats, users, notify [user_id] [message]',
      type: 'info'
    });
  } else if (command.value.startsWith('notify')) {
    const parts = command.value.split(' ');
    if (parts.length >= 3) {
      const targetUserId = parts[1];
      const message = parts.slice(2).join(' ');
      sendSystemNotification(targetUserId, message);
    } else {
      logs.value.push({
        timestamp: new Date().toISOString(),
        message: 'Usage: notify [user_id] [message]',
        type: 'error'
      });
    }
  }
  
  command.value = '';
  scrollToBottom();
};

let interval = null;

onMounted(() => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: 'Initializing monitor system...',
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
  padding: 1rem;
  box-sizing: border-box;
}

.terminal {
  background: #000;
  color: #0f0;
  font-family: 'Courier New', Courier, monospace;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
  border-radius: 4px;
}

.terminal-header {
  padding: 0.5rem 1rem;
  background: #111;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 1rem;
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.log-entry {
  margin-bottom: 0.25rem;
}

.timestamp {
  color: #888;
  margin-right: 0.5rem;
}

.activity { color: #00a8ff; }
.log { color: #ff9f43; }
.command { color: #fff; }
.info { color: #0f0; }

.terminal-footer {
  padding: 0.5rem 1rem;
  background: #111;
  border-top: 1px solid #333;
  display: flex;
  align-items: center;
}

.prompt {
  margin-right: 0.5rem;
  font-weight: bold;
}

input {
  background: transparent;
  border: none;
  color: #0f0;
  flex: 1;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
}
</style>
