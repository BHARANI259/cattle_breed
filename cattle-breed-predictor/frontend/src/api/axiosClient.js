import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 300000 // 5 minutes for LLM calls
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
    // Extract detailed error information
    let message = 'An error occurred'
    
    // Handle backend error response
    if (error.response?.data) {
      const data = error.response.data
      
      // Handle FastAPI HTTPException with detail as dict
      if (typeof data.detail === 'object' && data.detail !== null) {
        message = data.detail.reason || data.detail.message || JSON.stringify(data.detail)
      }
      // Handle FastAPI HTTPException with detail as string
      else if (typeof data.detail === 'string') {
        message = data.detail
      }
      // Handle other error structures
      else if (data.message) {
        message = data.message
      }
      else if (data.error) {
        message = data.error
      }
    }
    // Handle network/timeout errors
    else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout - the server is taking too long to respond. Please try again.'
    }
    // Handle connection errors
    else if (!error.response) {
      message = `Connection failed: ${error.message || 'Unable to connect to server'}`
    }
    // Standard error message
    else if (error.message) {
      message = error.message
    }
    
    console.error('[API Error]', {
      status: error.response?.status,
      message,
      data: error.response?.data,
      originalError: error.message
    })
    
    // Pass the error with preserved response for handlers
    const enhancedError = new Error(message)
    enhancedError.response = error.response
    enhancedError.code = error.code
    
    return Promise.reject(enhancedError)
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

