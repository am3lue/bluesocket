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

    const text = await response.text();
    console.log(`API Response (${endpoint}):`, text);

    if (response.status === 401) {
      this.setToken(null);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
    }

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
