import path from 'path'
import os from 'os'
import fs from 'fs-extra'

const AUTH_DIR = path.join(os.homedir(), '.openclaw')
const AUTH_FILE = path.join(AUTH_DIR, 'auth.json')
const INSTALLED_FILE = path.join(AUTH_DIR, 'installed.json')

export async function saveAuthToken(token: string) {
  await fs.ensureDir(AUTH_DIR)
  await fs.writeJson(AUTH_FILE, { token })
}

export function getAuthToken(): string | null {
  try {
    const data = fs.readJsonSync(AUTH_FILE)
    return data.token
  } catch {
    return null
  }
}

export function removeAuthToken() {
  try {
    fs.unlinkSync(AUTH_FILE)
  } catch {
    // Ignore errors
  }
}

export async function saveInstalledSkills(skills: any[]) {
  await fs.ensureDir(AUTH_DIR)
  await fs.writeJson(INSTALLED_FILE, { skills })
}

export async function getInstalledSkills() {
  try {
    const data = await fs.readJson(INSTALLED_FILE)
    return data.skills || []
  } catch {
    return []
  }
}