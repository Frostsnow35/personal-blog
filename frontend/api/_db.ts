declare global {
  const DB: D1Database | undefined
}

function getDB(): D1Database {
  if (!DB) {
    throw new Error('D1 database is not available')
  }
  return DB
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = getDB()
  const result = await db.prepare(sql).bind(...(params || [])).all()
  return result.results as T[]
}

export async function run(sql: string, params?: any[]): Promise<void> {
  const db = getDB()
  await db.prepare(sql).bind(...(params || [])).run()
}

export async function get<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const db = getDB()
  const result = await db.prepare(sql).bind(...(params || [])).first()
  return result as T | null
}

export async function getOne<T = any>(sql: string, params?: any[]): Promise<T> {
  const result = await get<T>(sql, params)
  if (result === null) {
    throw new Error('Record not found')
  }
  return result
}

export function parseJson<T = any>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function stringifyJson(value: any): string {
  return JSON.stringify(value)
}

export function success(data: any): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

export function error(message: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}