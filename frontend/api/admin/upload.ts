export const config = {
  runtime: 'edge'
}

import { success, error } from '../_db'

export default async function handler(request: Request): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !validateToken(token)) {
    return error('Unauthorized', 401)
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return error('未选择文件', 400)
  }

  const bytes = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)))
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filename = `${Date.now()}.${ext}`

  const url = `data:image/${ext};base64,${base64}`

  return success({ url })
}

function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}