// utils/apiService.js
class ApiService {
  constructor() {
    this.baseURL = "http://localhost:5000";
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Session Management
  async createSession(userDetails) {
    return this.request("/session/create", {
      method: "POST",
      body: JSON.stringify(userDetails),
    });
  }

  async uploadVideo(sessionId, file) {
    const formData = new FormData();
    formData.append("video", file);

    return this.request(`/session/${sessionId}/upload`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async extractAudio(sessionId) {
    return this.request(`/session/${sessionId}/extract-audio`, {
      method: "POST",
    });
  }

  async generateTranscript(sessionId) {
    return this.request(`/session/${sessionId}/transcript`, {
      method: "POST",
    });
  }

  async saveBodyMetrics(sessionId, bodyMetrics) {
    return this.request(`/session/${sessionId}/body-metrics`, {
      method: "POST",
      body: JSON.stringify(bodyMetrics),
    });
  }

  async scoreSession(sessionId) {
    return this.request(`/session/score/${sessionId}`, {
      method: "POST",
    });
  }

  // Helper to get full session data
  async getSessionData(sessionId) {
    return this.scoreSession(sessionId);
  }
}

// Create global instance
window.apiService = new ApiService();
