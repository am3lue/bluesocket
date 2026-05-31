<template>
  <div class="user-list">
    <div class="user-list-header">Users</div>
    <div 
      v-for="user in users" 
      :key="user.user_id" 
      class="user-item" 
      :class="{ active: activeUserId === user.user_id }"
      @click="$emit('select-user', user.user_id)"
    >
      <div class="user-status" :class="user.status.toLowerCase()"></div>
      <div class="user-info">
        <div class="username">{{ user.username }}</div>
        <div class="status-text">{{ user.status }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  users: Array,
  activeUserId: String
});

defineEmits(['select-user']);
</script>

<style scoped>
.user-list {
  background: #1e1e1e;
  height: 100%;
}

.user-list-header {
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #333;
}

.user-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:hover {
  background: #2a2a2a;
}

.user-item.active {
  background: #333;
}

.user-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.user-status.online { background: #4cd137; }
.user-status.away { background: #fbc531; }
.user-status.offline { background: #7f8c8d; }

.username {
  font-weight: 500;
}

.status-text {
  font-size: 0.75rem;
  color: #888;
}
</style>
