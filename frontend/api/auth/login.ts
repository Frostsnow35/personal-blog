export const config = {
  runtime: 'edge',
}

function base64url(bytes) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function createJwt(username, role) {
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub: username, role, exp: now + 120 * 60, iat: now }
  const headerStr = JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  const payloadStr = JSON.stringify(payload)
  const encoder = new TextEncoder()
  const header = base64url(encoder.encode(headerStr))
  const payloadB64 = base64url(encoder.encode(payloadStr))
  const key = await crypto.subtle.importKey('raw', encoder.encode('default-jwt-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payloadB64}`))
  const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${header}.${payloadB64}.${signature}`
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  try {
    const rawBody = await request.text()
    const data = JSON.parse(rawBody)
    const username = (data.username || '').trim()
    const password = data.password || ''

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: '用户名或密码不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      })
    }

    if (username === 'admin' && password === 'admin') {
      const token = await createJwt(username, 'admin')
      return new Response(JSON.stringify({ success: true, access_token: token, user: { username, role: 'admin' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      })
    }

    return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ success: false, message: 'Server error', error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    })
  }
}