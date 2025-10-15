import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const useApi = () => {
  const { getAuthHeaders } = useAuth()

  const fetchApi = async (endpoint, options = {}) => {
    const headers = await getAuthHeaders()
    const url = `${API_BASE_URL}${endpoint}`

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  const get = (endpoint, options = {}) => {
    return fetchApi(endpoint, { ...options, method: 'GET' })
  }

  const post = (endpoint, data, options = {}) => {
    return fetchApi(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  const put = (endpoint, data, options = {}) => {
    return fetchApi(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  const del = (endpoint, options = {}) => {
    return fetchApi(endpoint, { ...options, method: 'DELETE' })
  }

  // Convenience methods for common endpoints
  const studyPlan = {
    get: () => get('/personalization/study-plan'),
    generate: () => post('/personalization/study-plan/generate'),
    linkDrill: (taskId, drillId) => post(`/personalization/study-plan/task/${taskId}/link-drill`, { drill_id: drillId }),
    completeTask: (taskId, drillId) => post(`/personalization/study-plan/task/${taskId}/complete`, { drill_id: drillId })
  }

  const drill = {
    create: (config) => post('/skill-builder/drill', config),
    get: (drillId, includeQuestions = false) => get(`/skill-builder/drills/${drillId}?include_questions=${includeQuestions}`),
    submit: (drillId, answers, timeTaken) => post('/skill-builder/drill/submit', {
      session_id: drillId,
      answers,
      time_taken: timeTaken
    }),
    history: (limit = 50) => get(`/skill-builder/drills/history?limit=${limit}`),
    start: (drillId) => post(`/skill-builder/drill/${drillId}/start`)
  }

  const insights = {
    ability: (userId) => get(`/insights/ability/${userId}`),
    mastery: (userId) => get(`/insights/mastery/${userId}`)
  }

  return {
    get,
    post,
    put,
    del,
    studyPlan,
    drill,
    insights
  }
}
