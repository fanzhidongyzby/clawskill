import axios, { AxiosInstance } from 'axios'
import type { Skill, User, AuditLog } from '../types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
    })

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  // Skills
  async getSkills(params?: any) {
    return this.client.get('/skills', { params })
  }

  async getSkill(id: string) {
    return this.client.get(`/skills/${id}`)
  }

  async createSkill(data: Partial<Skill>) {
    return this.client.post('/skills', data)
  }

  async updateSkill(id: string, data: Partial<Skill>) {
    return this.client.put(`/skills/${id}`, data)
  }

  async deleteSkill(id: string) {
    return this.client.delete(`/skills/${id}`)
  }

  async getMySkills() {
    return this.client.get('/skills/my')
  }

  async installSkill(id: string) {
    return this.client.post(`/skills/${id}/install`)
  }

  async searchSkills(query: string, filters?: any) {
    return this.client.post('/skills/search', { query, filters })
  }

  // Users
  async getUsers() {
    return this.client.get('/admin/users')
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.client.put(`/admin/users/${id}`, data)
  }

  async deleteUser(id: string) {
    return this.client.delete(`/admin/users/${id}`)
  }

  // Admin
  async getPendingSkills() {
    return this.client.get('/admin/skills?status=pending')
  }

  async approveSkill(id: string) {
    return this.client.post(`/admin/skills/${id}/approve`)
  }

  async rejectSkill(id: string) {
    return this.client.post(`/admin/skills/${id}/reject`)
  }

  async getAuditLogs() {
    return this.client.get('/admin/audit')
  }
}

export const apiClient = new ApiClient()
export default apiClient