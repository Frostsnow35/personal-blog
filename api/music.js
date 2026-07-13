const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { keywords, id, br = '320000' } = req.query;
  
  let targetUrl;
  if (keywords) {
    targetUrl = `https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&s=${encodeURIComponent(keywords)}&type=1&offset=0&total=true&limit=10`;
  } else if (id) {
    targetUrl = `https://music.163.com/api/song/enhance/player/url?csrf_token=&ids=[${id}]&br=${br}`;
  } else {
    res.status(400).json({ success: false, message: '缺少参数' });
    return;
  }
  
  const options = new URL(targetUrl);
  
  const requestOptions = {
    hostname: options.hostname,
    path: options.path + (options.search || ''),
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://music.163.com/',
      'Origin': 'https://music.163.com',
      'Accept': 'application/json',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  };
  
  return new Promise((resolve) => {
    const proxyReq = https.request(requestOptions, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.status(200).json({ success: true, data: jsonData });
        } catch (e) {
          res.status(500).json({ success: false, message: '解析响应失败' });
        }
        resolve();
      });
    });
    
    proxyReq.on('error', (e) => {
      res.status(500).json({ success: false, message: e.message });
      resolve();
    });
    
    proxyReq.end();
  });
};
