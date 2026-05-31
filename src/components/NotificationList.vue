<template>
  <div class="notifications-container">
    <div v-for="notif in notifications" :key="notif.id" 
         class="notification-item" 
         :class="[notif.type, { unread: !notif.read_status }]"
         @click="markRead(notif.id)">
      <div class="notif-icon">🔔</div>
      <div class="notif-content">
        <div class="notif-message">{{ notif.message }}</div>
        <div class="notif-time">{{ formatTime(notif.timestamp) }}</div>
      </div>
    </div>
    <div v-if="notifications.length === 0" class="no-notifs">
      No notifications
    </div>
  </div>
</template>

<script setup>
import { blueSocket } from '../services/bluesocket';

defineProps({
  notifications: Array
});

const markRead = (id) => {
  blueSocket.markNotificationRead(id);
};

const formatTime = (ts) => {
  return new Date(ts).toLocaleString();
};
</script>

<style scoped>
.notifications-container {
  width: 320px;
  max-width: calc(100vw - 2rem);
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

@media (max-width: 400px) {
  .notifications-container {
    position: fixed;
    top: 64px;
    right: 1rem;
    left: 1rem;
    width: auto;
    max-width: none;
  }
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.notification-item.unread {
  background: rgba(0, 168, 255, 0.05);
  border-left: 3px solid var(--primary);
}

.notif-icon {
  font-size: 1.2rem;
}

.notif-content {
  flex: 1;
}

.notif-message {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  line-height: 1.4;
  color: var(--text-main);
}

.notif-time {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.no-notifs {
  padding: 2rem;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.9rem;
}

.info .notif-icon { color: var(--primary); }
.warning .notif-icon { color: var(--warning); }
.error .notif-icon { color: var(--error); }
</style>
