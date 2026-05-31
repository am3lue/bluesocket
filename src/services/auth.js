import { api } from './api';
import { reactive } from 'vue';

export const authState = reactive({
  user: JSON.parse(localStorage.getItem('bs_user')) || null,
  isAuthenticated: !!localStorage.getItem('bs_token'),
});

export const authService = {
  async login(username, password) {
    try {
      const data = await api.post('/auth/login', { username, password });
      api.setToken(data.token);
      localStorage.setItem('bs_user', JSON.stringify(data.user));
      authState.user = data.user;
      authState.isAuthenticated = true;
      return data;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      api.setToken(null);
      localStorage.removeItem('bs_user');
      authState.user = null;
      authState.isAuthenticated = false;
    }
  }
};
