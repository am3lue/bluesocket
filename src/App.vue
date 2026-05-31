<template>
  <div class="app-container">
    <header v-if="authState.isAuthenticated" class="app-header">
      <div class="logo">BlueSocket</div>
      <nav>
        <router-link to="/chat">Chat</router-link>
        <router-link to="/admin">Admin</router-link>
        
        <div class="notifications-wrapper">
          <button @click="toggleNotifications" class="notif-toggle">
            🔔 <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>
          <NotificationList v-if="showNotifications" :notifications="bsState.notifications" class="notif-dropdown" />
        </div>

        <button @click="handleLogout" class="logout-btn">Logout</button>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { authState, authService } from './services/auth';
import { bsState } from './services/bluesocket';
import { useRouter } from 'vue-router';
import NotificationList from './components/NotificationList.vue';

const router = useRouter();
const showNotifications = ref(false);

const unreadCount = computed(() => {
  return bsState.notifications.filter(n => !n.read_status).length;
});

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const handleLogout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style>
:root {
  --primary-color: #00a8ff;
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --header-bg: #1e1e1e;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  height: 60px;
  background-color: var(--header-bg);
  border-bottom: 1px solid #333;
}

.logo {
  font-weight: bold;
  font-size: 1.5rem;
  color: var(--primary-color);
}

nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

nav a {
  color: var(--text-color);
  text-decoration: none;
}

nav a.router-link-active {
  color: var(--primary-color);
}

.notifications-wrapper {
  position: relative;
}

.notif-toggle {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff5252;
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: bold;
}

.notif-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  margin-top: 10px;
}

.logout-btn {
  background: transparent;
  border: 1px solid #444;
  color: #fff;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.logout-btn:hover {
  background: #333;
}

main {
  flex: 1;
  overflow: hidden;
}
</style>
