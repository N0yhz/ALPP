import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // MANDATORY for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add an interceptor to handle errors globally if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong'
    const customError = new Error(message)
    customError.status = error.response?.status
    return Promise.reject(customError)
  }
)

export const api = {
  // --- Auth ---
  register: async (userData) => {
    // userData: { email, password }
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  login: async (email, password) => {
    // Standard OAuth2 might need form-data, but the guide specifies JSON.
    // If 422 occurs, it might expect { username, password }
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  verify: async (email, code) => {
    const response = await apiClient.post('/auth/verify', { email, code })
    return response.data
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  deleteAccount: async () => {
    const response = await apiClient.delete('/users/me')
    return response.data
  },

  requestPasswordReset: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (email, code, password) => {
    const response = await apiClient.post('/auth/reset-password', { email, code, password })
    return response.data
  },

  updateProfile: async (profileData) => {
    // profileData: { first_name, last_name, role, job_role, grade, subject }
    const response = await apiClient.patch('/users/me/profile', profileData)
    return response.data
  },

  // --- AI & Lesson Generation ---
  getChatHistory: async (sessionId) => {
    const response = await apiClient.get(`/ai/chat/${sessionId}/history`)
    return response.data
  },

  sendMessage: async (message, sessionId, settings = {}) => {
    const response = await apiClient.post('/ai/chat', {
      message,
      session_id: sessionId,
      difficulty: settings.difficulty || 'Medium',
      use_global_database: !!settings.useGlobal,
      use_websearch: !!settings.useWebsearch,
    })
    return response.data
  },

  downloadLessonPDF: async (requestData) => {
    const response = await apiClient.post('/ai/generate-lesson-pdf', requestData, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.body.appendChild(document.createElement('a'))
    link.href = url
    link.setAttribute('download', `lesson-${requestData.topic || 'export'}.pdf`)
    link.click()
    link.remove()
    return response.data
  },

  // --- Document Management ---
  uploadFile: async (file, sessionId, metadata = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (sessionId) formData.append('session_id', sessionId)
    if (metadata.is_shared) formData.append('is_shared', String(metadata.is_shared))
    if (metadata.grade) formData.append('grade', metadata.grade)
    if (metadata.subject) formData.append('subject', metadata.subject)
    if (metadata.topic) formData.append('topic', metadata.topic)

    const response = await apiClient.post('/ai/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getMyDocuments: async () => {
    const response = await apiClient.get('/documents/')
    return response.data
  },

  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/documents/${documentId}`)
    return response.data
  },
}

export default apiClient
