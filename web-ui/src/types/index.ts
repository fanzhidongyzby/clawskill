export interface Skill {
  id: string
  name: string
  description?: string
  author: string
  version: string
  category: string
  tags?: string[]
  rating?: number
  downloads?: number
  status?: 'published' | 'draft' | 'archived'
  audit_status?: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
  versions?: SkillVersion[]
}

export interface SkillVersion {
  version: string
  created_at: string
  changelog?: string
}

export interface SkillCategory {
  id: string
  name: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'developer' | 'user'
  created_at: string
  last_active?: string
}

export interface AuditLog {
  id: string
  action: string
  operator: string
  target: string
  result: 'success' | 'failure'
  ip: string
  timestamp: string
}