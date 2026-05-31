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
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.5);
}

.notification-item {
  padding: 0.75rem;
  border-bottom: 1px solid #333;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #2a2a2a;
}

.notification-item.unread {
  background: #252525;
  border-left: 3px solid #00a8ff;
}

.notif-icon {
  font-size: 1.2rem;
}

.notif-message {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.notif-time {
  font-size: 0.7rem;
  color: #888;
}

.no-notifs {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.info .notif-icon { color: #00a8ff; }
.warning .notif-icon { color: #fbc531; }
.error .notif-icon { color: #ff5252; }
</style>
