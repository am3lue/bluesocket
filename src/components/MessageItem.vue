<template>
  <div class="message-wrapper" :class="{ mine: isMine }">
    <div class="message-bubble">
      <div class="message-text">{{ message.text }}</div>
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: Object,
  isMine: Boolean
});

const formatTime = (ts) => {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.message-wrapper {
  display: flex;
  margin-bottom: 0.5rem;
}

.message-wrapper.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem;
  border-radius: 8px;
  background: #2a2a2a;
  position: relative;
}

.mine .message-bubble {
  background: #00a8ff;
  color: #fff;
}

.message-text {
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 0.25rem;
  text-align: right;
}
</style>
