const axios = require('axios');

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
    try {
      const apiUrl = `https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&s=${encodeURIComponent(keywords)}&type=1&offset=0&total=true&limit=10`;
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Origin': 'https://music.163.com'
        },
        timeout: 15000
      });
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else if (id) {
    try {
      const apiUrl = `https://music.163.com/api/song/enhance/player/url?csrf_token=&ids=[${id}]&br=${br}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Origin': 'https://music.163.com'
        },
        timeout: 15000
      });
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(400).json({ success: false, message: '缺少参数' });
  }
};
