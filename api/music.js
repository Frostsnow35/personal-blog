const https = require('https');
const http = require('http');

async function fetchUrl(targetUrl, headers = {}, method = 'GET', body = null, followRedirect = false) {
  const urlObj = new URL(targetUrl);
  const protocol = urlObj.protocol === 'https:' ? https : http;
  
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Origin': 'https://music.163.com',
    ...headers
  };
  
  const requestOptions = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: method,
    headers: defaultHeaders,
    timeout: 15000,
    maxRedirects: followRedirect ? 3 : 0
  };
  
  return new Promise((resolve, reject) => {
    const proxyReq = protocol.request(requestOptions, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      proxyRes.on('end', () => {
        resolve({ status: proxyRes.statusCode, headers: proxyRes.headers, body: data });
      });
    });
    
    proxyReq.on('error', (e) => {
      reject(e);
    });
    
    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      reject(new Error('请求超时'));
    });
    
    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}

async function verifyUrl(url) {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://music.163.com/'
      },
      timeout: 10000
    };
    
    return new Promise((resolve) => {
      const proxyReq = protocol.request(requestOptions, (proxyRes) => {
        const contentType = proxyRes.headers['content-type'] || '';
        const contentLength = proxyRes.headers['content-length'] || '0';
        const isValid = (proxyRes.statusCode === 200 || proxyRes.statusCode === 206) && 
                        (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('mp3') || parseInt(contentLength) > 1000);
        resolve(isValid);
      });
      
      proxyReq.on('error', () => {
        resolve(false);
      });
      
      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        resolve(false);
      });
      
      proxyReq.end();
    });
  } catch (e) {
    return false;
  }
}

async function getAudioUrl(songId) {
  const apis = [
    `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
    `https://netease-cloud-music-api-eta-five.vercel.app/song/url?id=${songId}`,
    `https://api.injahow.cn/meting/api?server=netease&type=song&id=${songId}`,
    `https://api.bzqll.com/music/netease/song?id=${songId}&type=json`,
  ];
  
  for (const url of apis) {
    try {
      const responseData = await fetchUrl(url);
      
      if (responseData.status === 200) {
        if (url.includes('outer/url')) {
          const location = responseData.headers['location'];
          if (location && location.startsWith('http') && !location.includes('404')) {
            const isValid = await verifyUrl(location);
            if (isValid) return location;
          }
          continue;
        }
        
        let jsonData;
        try {
          jsonData = JSON.parse(responseData.body);
        } catch {
          continue;
        }
        
        let audioUrl = null;
        
        if (jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
          audioUrl = jsonData.data[0].url || jsonData.data[0].mp3Url || null;
        } else if (jsonData.url) {
          audioUrl = jsonData.url;
        } else if (jsonData.data && jsonData.data.url) {
          audioUrl = jsonData.data.url;
        }
        
        if (audioUrl && audioUrl.startsWith('http') && !audioUrl.includes('404')) {
          const isValid = await verifyUrl(audioUrl);
          if (isValid) return audioUrl;
        }
      } else if (responseData.status === 302 && responseData.headers['location']) {
        const loc = responseData.headers['location'];
        if (loc && loc.startsWith('http') && !loc.includes('404')) {
          const isValid = await verifyUrl(loc);
          if (isValid) return loc;
        }
      }
    } catch (e) {
      console.warn(`API ${url} failed:`, e.message);
      continue;
    }
  }
  
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { id, stream } = req.query;
  
  if (!id) {
    res.status(400).json({ success: false, message: '缺少歌曲ID参数' });
    return;
  }
  
  try {
    const audioUrl = await getAudioUrl(id);
    
    if (!audioUrl) {
      res.status(200).json({ 
        success: false, 
        message: '无法获取播放链接，可能是版权限制或所有备用源都不可用',
        triedApis: [
          '网易云外链接口',
          '第三方API 1',
          '第三方API 2',
          '第三方API 3'
        ]
      });
      return;
    }
    
    if (stream) {
      const urlObj = new URL(audioUrl);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Range': req.headers['range'] || '',
        },
        timeout: 30000
      };
      
      const proxyReq = protocol.request(requestOptions, (proxyRes) => {
        res.statusCode = proxyRes.statusCode || 200;
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'audio/mpeg');
        res.setHeader('Content-Length', proxyRes.headers['content-length'] || '');
        res.setHeader('Content-Range', proxyRes.headers['content-range'] || '');
        res.setHeader('Accept-Ranges', 'bytes');
        
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (e) => {
        console.error('音频流代理失败:', e.message);
        res.status(500).json({ success: false, message: '音频流代理失败', error: e.message });
      });
      
      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.status(504).json({ success: false, message: '音频流请求超时' });
      });
      
      proxyReq.end();
      
      return;
    }
    
    res.status(200).json({ success: true, data: { url: audioUrl } });
  } catch (error) {
    console.error('服务器内部错误:', error.message);
    res.status(500).json({ success: false, message: '服务器内部错误', error: error.message });
  }
};