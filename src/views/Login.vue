<template>
  <div class="login-view">
    <div class="login-container glass">
      <div class="login-header">
        <div class="logo-icon-large">B</div>
        <h1>BlueSocket</h1>
        <p>Stateless Real-Time Protocol</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
            placeholder="e.g., satoshi" 
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="••••••••" 
            class="input-field"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="btn-primary login-btn">
          {{ loading ? 'Establishing Session...' : 'Enter Workspace' }}
        </button>
        
        <transition name="shake">
          <p v-if="error" class="error-msg">{{ error }}</p>
        </transition>
      </form>
      
      <div class="login-footer">
        <span class="status-dot"></span> Secure Stateless Environment
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../services/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authService.login(username.value, password.value);
    router.push('/chat');
  } catch (err) {
    error.value = err.message || 'Authentication failed';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 3rem 2.5rem;
  border-radius: 24px;
  text-align: center;
}

.logo-icon-large {
  width: 64px;
  height: 64px;
  background: var(--primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: #000;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 30px var(--primary-glow);
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -1px;
}

p {
  color: var(--text-dim);
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

.login-form {
  margin-top: 2.5rem;
  text-align: left;
}

.input-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
  margin-left: 0.25rem;
}

.input-field {
  width: 100%;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  margin-top: 1rem;
}

.error-msg {
  color: var(--error);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 1rem;
  background: rgba(255, 82, 82, 0.1);
  padding: 8px;
  border-radius: 6px;
}

.login-footer {
  margin-top: 2.5rem;
  font-size: 0.8rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--success);
}

/* Animations */
.shake-enter-active {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
