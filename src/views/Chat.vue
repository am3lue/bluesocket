<template>
  <div class="chat-view" :class="{ 'mobile-chat-active': selectedUserId }">
    <div class="sidebar">
      <UserList :users="users" :active-user-id="selectedUserId" @select-user="selectUser" />
    </div>
    <div class="main-chat">
      <div v-if="selectedUserId" class="mobile-header">
        <button @click="selectedUserId = null" class="back-btn">
          <span>←</span>
        </button>
        <div class="user-info">
          <span class="username">{{ selectedUser?.username }}</span>
          <span class="status">online</span>
        </div>
      </div>
      <ChatWindow 
        v-if="selectedUserId" 
        :user="selectedUser" 
        :messages="currentChatMessages" 
        @send-message="sendMessage" 
      />
      <div v-else class="no-selection">
        <div class="welcome-card glass">
          <div class="welcome-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a user from the list to start chatting</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import UserList from '../components/UserList.vue';
import ChatWindow from '../components/ChatWindow.vue';
import { blueSocket, bsState } from '../services/bluesocket';

const users = ref([]);
const selectedUserId = ref(null);

const selectedUser = computed(() => {
  return users.value.find(u => u.user_id === selectedUserId.value);
});

const currentChatMessages = computed(() => {
  if (!selectedUserId.value) return [];
  
  // Filter messages from events
  // Note: sync_events payload contains { message_id, from_user_id, payload: { message } }
  return bsState.events
    .filter(e => e.event_type === 'message')
    .filter(e => 
      (e.payload.from_user_id === selectedUserId.value) || 
      (e.user_id === selectedUserId.value && e.payload.from_user_id === bsState.connection.user_id)
    )
    .map(e => ({
      id: e.payload.message_id,
      from: e.payload.from_user_id,
      text: e.payload.payload.message,
      timestamp: e.timestamp
    }));
});

const selectUser = (userId) => {
  selectedUserId.value = userId;
};

const sendMessage = async (text) => {
  if (!selectedUserId.value) return;
  
  try {
    const response = await blueSocket.sendMessage(selectedUserId.value, { message: text });
    
    // Optimistically add to events so it shows up in chat window
    // In a real app, the server might send a sync event for the sender too, or we handle it here
    bsState.events.push({
      event_type: 'message',
      user_id: selectedUserId.value,
      timestamp: response.timestamp,
      payload: {
        message_id: response.message_id,
        from_user_id: bsState.connection.user_id,
        payload: { message: text }
      }
    });
  } catch (err) {
    console.error('Failed to send message', err);
  }
};

const fetchUsers = async () => {
  users.value = await blueSocket.getPresence();
};

let presenceInterval = null;

onMounted(async () => {
  if (!bsState.connection) {
    await blueSocket.register();
  }
  
  blueSocket.startPolling();
  fetchUsers();
  presenceInterval = setInterval(fetchUsers, 5000);
});

onUnmounted(() => {
  blueSocket.stopPolling();
  if (presenceInterval) clearInterval(presenceInterval);
});
</script>

<style scoped>
.chat-view {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 300px;
  border-right: 1px solid var(--border);
  background: var(--bg-sidebar);
  overflow-y: auto;
}

.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.1);
}

.mobile-header {
  display: none;
  padding: 0.75rem 1rem;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border);
  align-items: center;
  gap: 1rem;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info .username {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-info .status {
  font-size: 0.75rem;
  color: var(--success);
}

.no-selection {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.welcome-card {
  text-align: center;
  padding: 3rem;
  border-radius: 24px;
  max-width: 400px;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.welcome-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.welcome-card p {
  color: var(--text-dim);
  margin: 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    display: block;
  }
  
  .main-chat {
    display: none;
  }
  
  .chat-view.mobile-chat-active .sidebar {
    display: none;
  }
  
  .chat-view.mobile-chat-active .main-chat {
    display: flex;
    position: fixed;
    inset: 64px 0 0 0; /* Adjust for header height */
    z-index: 100;
  }
  
  .mobile-header {
    display: flex;
  }
}
</style>
