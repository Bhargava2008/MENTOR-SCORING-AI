// public/js/auth.js
class AuthService {
  constructor() {
    this.baseURL =
      window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://mentor-scoring-ai.onrender.com/api";
    this.token = localStorage.getItem("token");
    this.user = JSON.parse(localStorage.getItem("user") || "{}");
    this.institution = JSON.parse(
      localStorage.getItem("institution") || "null"
    );
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.institution) {
        localStorage.setItem("institution", JSON.stringify(data.institution));
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async registerIndividual(email, password, name, institutionCode) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register/individual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, institutionCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async registerInstitution(
    email,
    password,
    name,
    institutionName,
    description
  ) {
    try {
      const response = await fetch(
        `${this.baseURL}/auth/register/institution`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name,
            institutionName,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("institution", JSON.stringify(data.institution));

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  isLoggedIn() {
    return !!this.token;
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("institution");
    window.location.href = "index.html";
  }

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getInstitution() {
    const institutionStr = localStorage.getItem("institution");
    return institutionStr ? JSON.parse(institutionStr) : null;
  }
}

// Initialize auth service globally
window.authService = new AuthService();
