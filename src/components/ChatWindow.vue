<template>
  <div class="chat-window">
    <div class="chat-header glass">
      <div class="user-meta">
        <div class="avatar-small">{{ user?.username.charAt(0).toUpperCase() }}</div>
        <div class="user-info">
          <div class="user-name">{{ user?.username }}</div>
          <div class="user-status">
            <span class="status-dot"></span> Active Session
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn">📞</button>
        <button class="icon-btn">📹</button>
        <button class="icon-btn">ℹ️</button>
      </div>
    </div>
    
    <div class="messages-viewport" ref="messagesRef">
      <div class="welcome-banner" v-if="messages.length === 0">
        <div class="banner-icon">✨</div>
        <h3>This is the start of your secure conversation</h3>
        <p>Messages are delivered via the BlueSocket stateless protocol.</p>
      </div>
      
      <MessageItem 
        v-for="msg in messages" 
        :key="msg.id" 
        :message="msg" 
        :is-mine="msg.from === bsState.connection.user_id" 
      />
    </div>
    
    <div class="input-area glass">
      <form @submit.prevent="handleSend" class="message-form">
        <button type="button" class="attach-btn">+</button>
        <input 
          type="text" 
          v-model="newMessage" 
          placeholder="Type a secure message..." 
          class="message-input"
        />
        <button type="submit" :disabled="!newMessage.trim()" class="send-btn">
          <span v-if="!newMessage.trim()">🔒</span>
          <span v-else>🚀</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import MessageItem from './MessageItem.vue';
import { bsState } from '../services/bluesocket';

const props = defineProps({
  user: Object,
  messages: Array
});

const emit = defineEmits(['send-message']);

const newMessage = ref('');
const messagesRef = ref(null);

const handleSend = () => {
  if (!newMessage.value.trim()) return;
  emit('send-message', newMessage.value);
  newMessage.value = '';
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTo({
        top: messagesRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

watch(() => props.messages.length, scrollToBottom);
watch(() => props.user?.user_id, scrollToBottom);
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-dark);
  position: relative;
}

.chat-header {
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  border-radius: 0;
  border-left: none;
  border-top: none;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-small {
  width: 36px;
  height: 36px;
  background: var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--primary);
  font-size: 0.9rem;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-status {
  font-size: 0.75rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.messages-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-banner {
  margin: auto;
  text-align: center;
  max-width: 300px;
}

.banner-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.welcome-banner h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.welcome-banner p {
  font-size: 0.85rem;
  color: var(--text-dim);
}

.input-area {
  padding: 1.25rem 1.5rem;
  border-radius: 0;
  border-left: none;
  border-bottom: none;
  border-right: none;
}

.message-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.attach-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-dim);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: var(--transition);
}

.attach-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
}

.message-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  outline: none;
  transition: var(--transition);
}

.message-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--primary);
}

.send-btn {
  background: var(--primary);
  border: none;
  color: #000;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: var(--transition);
  box-shadow: 0 4px 12px var(--primary-glow);
}

.send-btn:disabled {
  background: var(--border);
  box-shadow: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--primary-glow);
}
</style>
