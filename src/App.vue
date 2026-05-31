<template>
  <div class="app-container">
    <header v-if="authState.isAuthenticated" class="app-header glass">
      <div class="logo-section">
        <div class="logo-icon">B</div>
        <div class="logo-text">BlueSocket</div>
      </div>
      <nav class="main-nav">
        <router-link to="/chat" class="nav-link">
          <span class="icon">💬</span> Chat
        </router-link>
        <router-link to="/admin" class="nav-link">
          <span class="icon">💻</span> Monitor
        </router-link>
        
        <div class="divider"></div>

        <div class="notifications-wrapper">
          <button @click="toggleNotifications" class="notif-toggle" :class="{ active: showNotifications }">
            <span class="icon">🔔</span>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>
          <transition name="fade-slide">
            <NotificationList v-if="showNotifications" :notifications="bsState.notifications" class="notif-dropdown" />
          </transition>
        </div>

        <button @click="handleLogout" class="logout-btn">
          <span class="icon">🚀</span>
        </button>
      </nav>
    </header>
    <main class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-image: radial-gradient(circle at top right, rgba(0, 168, 255, 0.05), transparent),
                    radial-gradient(circle at bottom left, rgba(0, 168, 255, 0.03), transparent);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  height: 64px;
  z-index: 1000;
  border-bottom: 1px solid var(--border);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #000;
  box-shadow: 0 0 20px var(--primary-glow);
}

.logo-text {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.5px;
  background: linear-gradient(to right, #fff, var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-link {
  color: var(--text-dim);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.router-link-active {
  color: var(--primary);
  background: rgba(0, 168, 255, 0.1);
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 0.5rem;
}

.notifications-wrapper {
  position: relative;
}

.notif-toggle {
  background: transparent;
  border: none;
  color: var(--text-dim);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-toggle:hover, .notif-toggle.active {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--error);
  color: #fff;
  font-size: 0.65rem;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.4);
}

.notif-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  margin-top: 12px;
}

.logout-btn {
  background: rgba(255, 82, 82, 0.1);
  border: none;
  color: var(--error);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
}

.logout-btn:hover {
  background: var(--error);
  color: #fff;
}

.content-area {
  flex: 1;
  overflow: hidden;
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-fade-enter-active, .page-fade-leave-active {
  transition: opacity 0.2s ease;
}
.page-fade-enter-from, .page-fade-leave-to {
  opacity: 0;
}
</style>
