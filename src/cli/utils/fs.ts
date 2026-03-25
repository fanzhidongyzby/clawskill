import fs from 'fs-extra'
import path from 'path'

export async function readPackageJson(dirPath: string) {
  const pkgPath = path.join(dirPath, 'package.json')
  if (!(await fs.pathExists(pkgPath))) {
    throw new Error('未找到 package.json 文件')
  }
  return fs.readJson(pkgPath)
}

export async function ensureDir(dirPath: string) {
  await fs.ensureDir(dirPath)
}

export async function writeFile(filePath: string, content: string) {
  await fs.ensureFile(filePath)
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function readFile(filePath: string) {
  return fs.readFile(filePath, 'utf-8')
}