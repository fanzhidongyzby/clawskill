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

export interface SearchOptions {
  category?: string
  limit?: number
  offset?: number
}

export interface SearchResult {
  items: any[]
  total: number
}

// 基础关键词搜索
export async function searchSkills(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const response = await apiClient.get('/skills/search', {
    params: {
      q: query,
      ...options,
    },
  })
  return response.data
}

// 语义搜索（使用向量相似度）
export async function semanticSearch(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const response = await apiClient.post('/skills/semantic-search', {
    query,
    ...options,
  })
  return response.data
}

// 混合搜索（结合关键词和语义搜索）
export async function hybridSearch(query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const response = await apiClient.post('/skills/hybrid-search', {
    query,
    ...options,
  })
  return response.data
}