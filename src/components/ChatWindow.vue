<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="user-name">{{ user?.username }}</div>
    </div>
    <div class="messages-container" ref="messagesRef">
      <MessageItem 
        v-for="msg in messages" 
        :key="msg.id" 
        :message="msg" 
        :is-mine="msg.from === bsState.connection.user_id" 
      />
    </div>
    <div class="chat-input">
      <form @submit.prevent="handleSend">
        <input type="text" v-model="newMessage" placeholder="Type a message..." />
        <button type="submit" :disabled="!newMessage.trim()">Send</button>
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
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
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
  background: #121212;
}

.chat-header {
  padding: 1rem;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.user-name {
  font-weight: bold;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-input {
  padding: 1rem;
  background: #1e1e1e;
  border-top: 1px solid #333;
}

.chat-input form {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
}

.chat-input button {
  padding: 0 1.5rem;
  background: #00a8ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.chat-input button:disabled {
  opacity: 0.6;
}
</style>
