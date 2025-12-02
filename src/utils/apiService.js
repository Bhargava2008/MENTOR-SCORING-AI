// utils/apiService.js
class ApiService {
  constructor() {
    this.baseURL = "https://mentor-scoring-ai.onrender.com";
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
      headers: {},
    });
  }

  async extractAudio(sessionId) {
    return this.request(`/session/${sessionId}/extract-audio`, {
      method: "POST",
    });
  }

  async generateTranscript(sessionId) {
    return this.request(`/session/${sessionId}/transcript`, { method: "POST" });
  }

  async saveBodyMetrics(sessionId, bodyMetrics) {
    return this.request(`/session/${sessionId}/body-metrics`, {
      method: "POST",
      body: JSON.stringify(bodyMetrics),
    });
  }

  async scoreSession(sessionId) {
    return this.request(`/session/score/${sessionId}`, { method: "POST" });
  }

  async getSessionData(sessionId) {
    return this.scoreSession(sessionId);
  }
}

window.apiService = new ApiService();
