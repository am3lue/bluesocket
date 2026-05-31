import { api } from './api';
import { v4 as uuidv4 } from 'uuid';
import { reactive } from 'vue';

export const bsState = reactive({
  connection: JSON.parse(localStorage.getItem('bs_connection')) || null,
  lastSync: localStorage.getItem('bs_last_sync') || null,
  events: [],
  messages: JSON.parse(localStorage.getItem('bs_messages')) || [],
  notifications: [],
  isSyncing: false,
  syncInterval: 2000, // Default 2 seconds
});

function saveMessages() {
  localStorage.setItem('bs_messages', JSON.stringify(bsState.messages));
}

let syncTimer = null;

export const blueSocket = {
  // ... existing methods ...
  async register() {
    let deviceId = localStorage.getItem('bs_device_id');
    if (!deviceId) {
      deviceId = `device_${uuidv4().replace(/-/g, '')}`;
      localStorage.setItem('bs_device_id', deviceId);
    }

    try {
      const data = await api.post('/bluesocket/register', {
        device_id: deviceId,
        device_type: 'web'
      });
      bsState.connection = data;
      localStorage.setItem('bs_connection', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  },

  async sync() {
    if (!bsState.connection) return;
    if (bsState.isSyncing) return;

    bsState.isSyncing = true;
    try {
      const data = await api.get('/bluesocket/sync', {
        connection_id: bsState.connection.connection_id,
        last_sync_timestamp: bsState.lastSync,
        wait: 'true'
      });

      if (data.events && data.events.length > 0) {
        data.events.forEach(event => {
          if (event.event_type === 'message') {
            const msgData = event.payload;
            const message_id = msgData.message_id;
            const txId = msgData.payload.txId;

            // Deduplicate
            const existing = bsState.messages.find(m => (txId && m.txId === txId) || (message_id && m.message_id === message_id));
            
            if (existing) {
              existing.message_id = message_id;
              existing.status = 'delivered';
            } else {
              bsState.messages.push({
                message_id,
                txId,
                from_user_id: msgData.from_user_id,
                from_username: msgData.from_username,
                to_user_id: msgData.target,
                text: msgData.payload.text,
                timestamp: event.timestamp,
                status: 'received'
              });
            }
          } else if (event.event_type === 'notification') {
            bsState.notifications.unshift({
              id: event.payload.notification_id,
              type: event.payload.type,
              message: event.payload.payload.message,
              timestamp: event.timestamp,
              read_status: 0
            });
          }
        });
        saveMessages();
      }

      bsState.lastSync = data.server_timestamp;
      localStorage.setItem('bs_last_sync', data.server_timestamp);
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      bsState.isSyncing = false;
    }
  },

  async fetchNotifications() {
    try {
      const data = await api.get('/bluesocket/notifications');
      bsState.notifications = data.notifications.map(n => ({
        id: n.notification_id,
        type: n.type,
        message: n.payload.message,
        timestamp: n.created_at,
        read_status: n.read_status
      }));
    } catch (error) {
      console.error('Fetch notifications failed', error);
    }
  },

  async markNotificationRead(id) {
    try {
      await api.post('/bluesocket/mark-read', { notification_id: id });
      const notif = bsState.notifications.find(n => n.id === id);
      if (notif) notif.read_status = 1;
    } catch (error) {
      console.error('Mark read failed', error);
    }
  },

  startPolling() {
    this.stopPolling();
    this.sync(); // Initial sync
    syncTimer = setInterval(() => this.sync(), bsState.syncInterval);
  },

  stopPolling() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  },

  async sendMessage(toUserId, payload) {
    if (!bsState.connection) throw new Error('Not registered');

    const txId = uuidv4();
    const optimisticMsg = {
      txId,
      from_user_id: bsState.connection.user_id,
      from_username: 'ME',
      to_user_id: toUserId,
      text: payload.text,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    bsState.messages.push(optimisticMsg);
    saveMessages();

    try {
      const data = await api.post('/bluesocket/send', {
        to_user_id: toUserId,
        connection_id: bsState.connection.connection_id,
        payload: { ...payload, txId }
      });
      
      optimisticMsg.message_id = data.message_id;
      optimisticMsg.status = 'sent';
      saveMessages();
      
      return data;
    } catch (error) {
      optimisticMsg.status = 'error';
      saveMessages();
      console.error('Send message failed', error);
      throw error;
    }
  },

  async getPresence() {
    try {
      const data = await api.get('/bluesocket/presence');
      return data.users;
    } catch (error) {
      console.error('Presence fetch failed', error);
      return [];
    }
  }
};
