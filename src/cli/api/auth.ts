import axios from 'axios'
import { saveAuthToken, getAuthToken, removeAuthToken } from '../utils/auth'

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
})

export async function login(username: string, password: string) {
  const response = await apiClient.post('/auth/login', {
    username,
    password,
  })

  const { access_token, user } = response.data
  saveAuthToken(access_token)

  return { user, token: access_token }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    removeAuthToken()
  }
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export async function refreshToken() {
  const response = await apiClient.post('/auth/refresh')
  const { access_token } = response.data
  saveAuthToken(access_token)
  return access_token
}