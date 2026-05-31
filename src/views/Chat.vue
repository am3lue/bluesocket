<template>
  <div class="chat-view">
    <div class="sidebar">
      <UserList :users="users" :active-user-id="selectedUserId" @select-user="selectUser" />
    </div>
    <div class="main-chat">
      <ChatWindow 
        v-if="selectedUserId" 
        :user="selectedUser" 
        :messages="currentChatMessages" 
        @send-message="sendMessage" 
      />
      <div v-else class="no-selection">
        <p>Select a user to start chatting</p>
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
  border-right: 1px solid #333;
  overflow-y: auto;
}

.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-selection {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
}
</style>
