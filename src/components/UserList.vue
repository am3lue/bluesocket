<template>
  <div class="user-list-sidebar glass">
    <div class="sidebar-header">
      <div class="search-box">
        <input type="text" placeholder="Search contacts..." class="search-input" />
      </div>
    </div>
    
    <div class="list-container">
      <div class="section-label">Online Contacts — {{ onlineCount }}</div>
      <div 
        v-for="user in users" 
        :key="user.user_id" 
        class="user-card" 
        :class="{ active: activeUserId === user.user_id }"
        @click="$emit('select-user', user.user_id)"
      >
        <div class="avatar-wrapper">
          <div class="avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div class="status-indicator" :class="user.status.toLowerCase()"></div>
        </div>
        
        <div class="user-details">
          <div class="username">{{ user.username }}</div>
          <div class="last-seen">{{ user.status }}</div>
        </div>
        
        <div v-if="activeUserId === user.user_id" class="active-marker"></div>
      </div>
      
      <div v-if="users.length === 0" class="empty-state">
        No users found
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  users: Array,
  activeUserId: String
});

const onlineCount = computed(() => {
  return props.users.filter(u => u.status === 'ONLINE').length;
});

defineEmits(['select-user']);
</script>

<style scoped>
.user-list-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border-top: none;
  border-bottom: none;
  border-left: none;
}

.sidebar-header {
  padding: 1.25rem;
}

.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  transition: var(--transition);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--primary);
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.75rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 1rem 0.5rem 0.5rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  margin-bottom: 0.25rem;
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.04);
}

.user-card.active {
  background: rgba(0, 168, 255, 0.1);
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #2c3e50, #000);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--primary);
  border: 1px solid var(--border);
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-sidebar);
}

.status-indicator.online { background: var(--success); box-shadow: 0 0 10px var(--success); }
.status-indicator.away { background: var(--warning); }
.status-indicator.offline { background: var(--secondary); }

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-seen {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.active-marker {
  width: 3px;
  height: 20px;
  background: var(--primary);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--primary);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-size: 0.9rem;
}
</style>
