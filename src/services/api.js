class ApiService {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('bs_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('bs_token', token);
    } else {
      localStorage.removeItem('bs_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle unauthorized (maybe redirect to login or clear token)
      this.setToken(null);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }

    return data;
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiService();
