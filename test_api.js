const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');

const target = 'https://personal-blog-jade.vercel.app/api/health';
const proxyUrl = 'http://127.0.0.1:7890';

// Use proxy via CONNECT tunnel
const proxy = url.parse(proxyUrl);
const targetUrl = url.parse(target);

const connectReq = http.request({
  host: proxy.hostname,
  port: proxy.port,
  method: 'CONNECT',
  path: `${targetUrl.hostname}:443`,
  timeout: 30000,
});

connectReq.on('connect', (res, socket) => {
  if (res.statusCode !== 200) {
    fs.writeFileSync('e:/train/personal-blog/api_response.txt', `Proxy CONNECT failed: ${res.statusCode}`);
    console.log(`Proxy CONNECT failed: ${res.statusCode}`);
    return;
  }

  const tlsSocket = require('tls').connect({
    socket: socket,
    servername: targetUrl.hostname,
    rejectUnauthorized: false,
  }, () => {
    const reqPath = targetUrl.path || '/';
    socket.write(`GET ${reqPath} HTTP/1.1\r\nHost: ${targetUrl.hostname}\r\nConnection: close\r\n\r\n`);
  });

  let data = '';
  tlsSocket.on('data', chunk => data += chunk.toString());
  tlsSocket.on('end', () => {
    fs.writeFileSync('e:/train/personal-blog/api_response.txt', data);
    console.log(data.substring(0, 500));
  });
  tlsSocket.on('error', e => {
    fs.writeFileSync('e:/train/personal-blog/api_response.txt', `TLS Error: ${e.message}`);
    console.log(`TLS Error: ${e.message}`);
  });
});

connectReq.on('error', e => {
  fs.writeFileSync('e:/train/personal-blog/api_response.txt', `Proxy Error: ${e.message}`);
  console.log(`Proxy Error: ${e.message}`);
});

connectReq.on('timeout', () => {
  connectReq.destroy();
  fs.writeFileSync('e:/train/personal-blog/api_response.txt', 'Proxy connect timeout');
  console.log('Proxy connect timeout');
});

connectReq.end();
