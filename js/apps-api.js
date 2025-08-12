class AppsAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = localStorage.getItem('authToken');
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async getAllApps(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${this.baseURL}/apps?${params}`, {
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch apps');
      }
      
      return data;
    } catch (error) {
      console.error('Get apps error:', error);
      throw error;
    }
  }

  async getInstalledApps() {
    try {
      const response = await fetch(`${this.baseURL}/apps/installed`, {
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch installed apps');
      }
      
      return data;
    } catch (error) {
      console.error('Get installed apps error:', error);
      throw error;
    }
  }

  async installApp(appId) {
    try {
      const response = await fetch(`${this.baseURL}/apps/${appId}/install`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to install app');
      }
      
      return data;
    } catch (error) {
      console.error('Install app error:', error);
      throw error;
    }
  }

  async uninstallApp(appId) {
    try {
      const response = await fetch(`${this.baseURL}/apps/${appId}/uninstall`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to uninstall app');
      }
      
      return data;
    } catch (error) {
      console.error('Uninstall app error:', error);
      throw error;
    }
  }

  async getAppDetails(appId) {
    try {
      const response = await fetch(`${this.baseURL}/apps/${appId}`, {
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch app details');
      }
      
      return data;
    } catch (error) {
      console.error('Get app details error:', error);
      throw error;
    }
  }

  async rateApp(appId, rating, review = '') {
    try {
      const response = await fetch(`${this.baseURL}/apps/${appId}/rate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rating, review })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to rate app');
      }
      
      return data;
    } catch (error) {
      console.error('Rate app error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await fetch(`${this.baseURL}/apps/categories/list`, {
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }
      
      return data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }
}

window.appsAPI = new AppsAPI();