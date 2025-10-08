const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Generic HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Diagnostics API
  async getDiagnostics() {
    return this.request('/diagnostics')
  }

  async getDiagnostic(id) {
    return this.request(`/diagnostics/${id}`)
  }

  // Study Plans API
  async getStudyPlans() {
    return this.request('/study-plans')
  }

  async getStudyPlan(id) {
    return this.request(`/study-plans/${id}`)
  }

  // Drill API
  async createDrillSession(settings) {
    return this.request('/drill', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  }

  async submitDrillAnswers(sessionId, answers) {
    return this.request('/drill/submit', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        answers: answers,
      }),
    })
  }

  // Insights API
  async getAbilityEstimate(userId) {
    return this.get(`/insights/ability/${userId}`)
  }

  async getSkillMastery(userId) {
    return this.get(`/insights/mastery/${userId}`)
  }
}

export default new ApiService()
