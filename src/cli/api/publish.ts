import axios from 'axios'
import fs from 'fs-extra'
import FormData from 'form-data'
import { getAuthToken } from '../utils/auth'

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000/api',
  timeout: 60000,
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function publishSkill(data: {
  name: string
  version: string
  description: string
  category: string
  path: string
  dryRun?: boolean
}) {
  if (data.dryRun) {
    console.log('预发布模式，不会实际发布')
    return { success: true }
  }

  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('version', data.version)
  formData.append('description', data.description)
  formData.append('category', data.category)

  // 打包技能目录
  const archivePath = await createSkillArchive(data.path)
  formData.append('archive', fs.createReadStream(archivePath))

  const response = await apiClient.post('/skills/publish', formData, {
    headers: {
      ...formData.getHeaders(),
    },
  })

  return response.data
}

async function createSkillArchive(path: string): Promise<string> {
  // 这里应该实现打包逻辑（例如创建 tar.gz 文件）
  // 为简化，这里返回路径
  return path
}