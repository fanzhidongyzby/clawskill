import axios from 'axios'
import { getAuthToken } from '../utils/auth'

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function getSkillInfo(skillId: string) {
  const response = await apiClient.get(`/skills/${skillId}`)
  return response.data
}

export async function installSkill(skillId: string, options: { version?: string; force?: boolean }) {
  const response = await apiClient.post(`/skills/${skillId}/install`, options)
  return response.data
}

export async function uninstallSkill(skillId: string) {
  const response = await apiClient.delete(`/skills/${skillId}/uninstall`)
  return response.data
}

export async function updateSkill(skillId: string, targetVersion?: string) {
  const response = await apiClient.post(`/skills/${skillId}/update`, {
    target_version: targetVersion,
  })
  return response.data
}

export async function getSkillVersions(skillId: string) {
  const response = await apiClient.get(`/skills/${skillId}/versions`)
  return response.data
}

export async function rollbackSkill(skillId: string, targetVersion: string) {
  const response = await apiClient.post(`/skills/${skillId}/rollback`, {
    target_version: targetVersion,
  })
  return response.data
}