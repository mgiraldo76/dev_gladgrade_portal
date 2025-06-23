import axios from "axios"
import { auth } from "./firebase"

// Create an axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.gladgrade.com",
})

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth?.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// API endpoints
export const reviewsApi = {
  getAll: (params?: any) => api.get("/reviews", { params }),
  getById: (id: string) => api.get(`/reviews/${id}`),
  respond: (id: string, response: string) => api.post(`/reviews/${id}/respond`, { response }),
  moderate: (id: string, action: string) => api.post(`/reviews/${id}/moderate`, { action }),
}

export const reportsApi = {
  getGcsgTrends: (params?: any) => api.get("/reports/gcsg-trends", { params }),
  getSentimentAnalysis: (params?: any) => api.get("/reports/sentiment", { params }),
  getCustomReport: (params?: any) => api.post("/reports/custom", params),
}

export const partnersApi = {
  getRecommended: () => api.get("/partners/recommended"),
  getAll: (params?: any) => api.get("/partners", { params }),
  contact: (id: string, message: string) => api.post(`/partners/${id}/contact`, { message }),
}

export const usersApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: any) => api.put("/users/profile", data),
}

export default api
