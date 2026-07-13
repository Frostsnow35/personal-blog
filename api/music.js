const https = require('https');
const http = require('http');

async function fetchUrl(targetUrl, headers = {}) {
  const urlObj = new URL(targetUrl);
  const protocol = urlObj.protocol === 'https:' ? https : http;
  
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Origin': 'https://music.163.com',
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    ...headers
  };
  
  const requestOptions = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: defaultHeaders,
    timeout: 15000
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
    
    proxyReq.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { keywords, id, br = '320000' } = req.query;
  
  if (keywords) {
    const targetUrl = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(keywords)}&type=1&offset=0&limit=10`;
    try {
      const responseData = await fetchUrl(targetUrl);
      if (responseData.status === 200) {
        try {
          const jsonData = JSON.parse(responseData.body);
          res.status(200).json({ success: true, data: jsonData });
        } catch (e) {
          res.status(500).json({ 
            success: false, 
            message: '解析响应失败', 
            rawBodyLength: responseData.body.length,
            error: e.message 
          });
        }
      } else {
        res.status(responseData.status).json({ success: false, message: `上游服务返回 ${responseData.status}` });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
    return;
  }
  
  if (id) {
    const apiUrls = [
      `https://music.163.com/api/song/enhance/player/url/v1?csrf_token=&ids=[${id}]&level=standard&encodeType=mp3&br=${br}`,
      `https://music.163.com/api/song/enhance/player/url?csrf_token=&ids=[${id}]&br=${br}`,
      `https://api.injahow.cn/meting/api?server=netease&type=song&id=${id}`,
      `https://api.itooi.cn/music/netease/playUrl?id=${id}&quality=high`,
      `https://music.api.mucang.cn/netease/url/${id}`,
      `https://api.liuzhijin.cn/music/netease/song?id=${id}`,
      `https://api.bzqll.com/music/netease/song?id=${id}&type=json`,
      `https://api.samirchen.com/netease/song?id=${id}`,
      `https://api.geekzu.org/api/netease/song?id=${id}`,
      `https://music.666ccc.com/api/netease/song?id=${id}`,
    ];
    
    for (const url of apiUrls) {
      try {
        const responseData = await fetchUrl(url);
        if (responseData.status === 200) {
          try {
            const jsonData = JSON.parse(responseData.body);
            
            let audioUrl = null;
            
            if (jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
              audioUrl = jsonData.data[0].url || jsonData.data[0].mp3Url || jsonData.data[0].audio;
            } else if (jsonData.url) {
              audioUrl = jsonData.url;
            } else if (jsonData.data && jsonData.data.url) {
              audioUrl = jsonData.data.url;
            } else if (jsonData.songs && Array.isArray(jsonData.songs) && jsonData.songs.length > 0) {
              audioUrl = jsonData.songs[0].url || jsonData.songs[0].mp3Url;
            } else if (jsonData.result && jsonData.result.url) {
              audioUrl = jsonData.result.url;
            }
            
            if (audioUrl && audioUrl.startsWith('http')) {
              res.status(200).json({ success: true, data: { url: audioUrl } });
              return;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    res.status(200).json({ success: false, message: '无法获取播放链接，可能是版权限制', data: null });
    return;
  }
  
  res.status(400).json({ success: false, message: '缺少参数' });
};
