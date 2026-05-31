<template>
  <div class="message-row" :class="{ 'mine': isMine }">
    <div v-if="!isMine" class="avatar-tiny">
      {{ message.from.charAt(0).toUpperCase() }}
    </div>
    
    <div class="message-content">
      <div class="message-bubble" :class="{ 'glass-bubble': !isMine }">
        <div class="text">{{ message.text }}</div>
        <div class="meta">
          <span class="time">{{ formatTime(message.timestamp) }}</span>
          <span v-if="isMine" class="status-check">✓✓</span>
        </div>
      </div>
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
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  max-width: 85%;
}

.message-row.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar-tiny {
  width: 28px;
  height: 28px;
  background: var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dim);
  flex-shrink: 0;
  margin-bottom: 4px;
}

.message-content {
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  position: relative;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
}

.message-row.mine .message-bubble {
  background: var(--primary);
  color: #000;
  border-bottom-right-radius: 4px;
  font-weight: 500;
  box-shadow: 0 4px 15px var(--primary-glow);
}

.glass-bubble {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-main);
  border-bottom-left-radius: 4px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.7;
}

.message-row.mine .meta {
  color: rgba(0, 0, 0, 0.6);
}

.status-check {
  font-weight: bold;
}
</style>
