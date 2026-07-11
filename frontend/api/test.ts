export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  let body = null
  try {
    body = await request.text()
  } catch (e) {
    body = 'error reading body'
  }
  
  return new Response(JSON.stringify({ 
    test: 'async works', 
    method: request.method,
    body: body,
    headers: Object.fromEntries(request.headers)
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
  })
}