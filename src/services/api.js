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
    // Hit IRT endpoint and normalize shape to { ability_theta, ... }
    const resp = await this.get(`/insights/irt/${userId}`)
    if (resp && typeof resp === 'object') {
      // Prefer nested ability_estimate if present
      if (resp.ability_estimate && typeof resp.ability_estimate === 'object') {
        return resp.ability_estimate
      }
      // Fallback: some implementations may return the estimate at top level
      if (typeof resp.ability_theta !== 'undefined') {
        return resp
      }
    }
    return null
  }

  async getSkillMastery(userId) {
    // Hit Elo endpoint which returns { user_id, model_name, ratings: [...] }
    // Each rating has: skill_id, skill_name, rating, num_updates, last_updated
    const resp = await this.get(`/insights/elo/${userId}`)
    if (resp && resp.ratings) {
      // Transform to match expected format with skill_name and mastery info
      return {
        user_id: resp.user_id,
        model: resp.model_name,
        skills: resp.ratings.map(r => ({
          skill_id: r.skill_id,
          skill_name: r.skill_name || r.skill_id, // Use skill_name from backend, fallback to skill_id
          rating: r.rating,
          num_updates: r.num_updates,
          last_updated: r.last_updated
        }))
      }
    }
    return resp
  }

  // Adaptive Diagnostic API
  async startAdaptiveDiagnostic(userId = null) {
    const body = userId ? { user_id: userId } : {}
    return this.post('/skill-builder/adaptive-diagnostic', body)
  }

  async getAdaptiveDiagnosticSession(sessionId, userId = null) {
    const query = userId ? `?user_id=${userId}` : ''
    return this.get(`/skill-builder/adaptive-diagnostic/${sessionId}${query}`)
  }

  async submitDiagnosticAnswer(sessionId, answer, userId = null) {
    const body = { answer }
    if (userId) body.user_id = userId
    return this.post(`/skill-builder/adaptive-diagnostic/${sessionId}/answer`, body)
  }

  async completeDiagnostic(sessionId, userId = null) {
    const body = userId ? { user_id: userId } : {}
    return this.post(`/skill-builder/adaptive-diagnostic/${sessionId}/complete`, body)
  }
}

export default new ApiService()
