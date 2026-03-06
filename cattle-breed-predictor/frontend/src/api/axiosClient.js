import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
axiosClient.interceptors.request.use(
  config => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    console.error('[API Error]', message)
    return Promise.reject(new Error(message))
  }
)

// API Functions
export const predictBreed = (formData) => {
  return axiosClient.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const fetchHistory = (params) => {
  return axiosClient.get('/api/history', { params })
}

export const fetchPrediction = (id) => {
  return axiosClient.get(`/api/history/${id}`)
}

export const deletePrediction = (id) => {
  return axiosClient.delete(`/api/history/${id}`)
}

export const fetchStats = () => {
  return axiosClient.get('/api/stats')
}

export const fetchTimeline = (days) => {
  return axiosClient.get('/api/stats/timeline', { params: { days } })
}

export const fetchBreedInfo = (breed_name, confidence) => {
  return axiosClient.post('/api/breed-info', { breed_name, confidence })
}

export const fetchBreedCache = () => {
  return axiosClient.get('/api/breed-info/cache')
}

export const deleteBreedCache = (breed_name) => {
  return axiosClient.delete(`/api/breed-info/cache/${breed_name}`)
}

export default axiosClient

