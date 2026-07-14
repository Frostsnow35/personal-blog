const https = require('https');
const http = require('http');
const crypto = require('crypto');

const NETEASE_KEY = '0CoJUm6Qyw8W8jud';
const NETEASE_IV = '0102030405060708';

function decryptNeteaseData(encryptedData) {
  try {
    const key = Buffer.from(NETEASE_KEY, 'utf8');
    const iv = Buffer.from(NETEASE_IV, 'utf8');
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

async function fetchUrl(targetUrl, headers = {}, method = 'GET', body = null) {
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
    method: method,
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

async function getNeteaseAudioUrl(songId) {
  const apiUrls = [
    `https://music.163.com/api/song/enhance/player/url/v1?csrf_token=&ids=[${songId}]&level=standard&encodeType=mp3&br=320000`,
    `https://music.163.com/api/song/enhance/player/url?csrf_token=&ids=[${songId}]&br=320000`,
    `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
  ];
  
  for (const url of apiUrls) {
    try {
      const responseData = await fetchUrl(url);
      if (responseData.status === 200) {
        try {
          let jsonData;
          const body = responseData.body;
          
          if (body.length > 100 && !body.startsWith('{')) {
            jsonData = decryptNeteaseData(body);
          } else {
            jsonData = JSON.parse(body);
          }
          
          if (!jsonData && responseData.headers['location']) {
            const loc = responseData.headers['location'];
            if (loc && loc.startsWith('http') && !loc.includes('404')) {
              const isValid = await verifyUrl(loc);
              if (isValid) return loc;
            }
            continue;
          }
          
          let audioUrl = null;
          
          if (jsonData && jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
            audioUrl = jsonData.data[0].url || jsonData.data[0].mp3Url || jsonData.data[0].audio;
          } else if (jsonData && jsonData.url) {
            audioUrl = jsonData.url;
          } else if (jsonData && jsonData.data && jsonData.data.url) {
            audioUrl = jsonData.data.url;
          }
          
          if (audioUrl && audioUrl.startsWith('http') && !audioUrl.includes('404') && !audioUrl.includes('music.163.com/404')) {
            const isValid = await verifyUrl(audioUrl);
            if (isValid) return audioUrl;
          }
        } catch (e) {
          continue;
        }
      } else if (responseData.status === 302 && responseData.headers['location']) {
        const loc = responseData.headers['location'];
        if (loc && loc.startsWith('http') && !loc.includes('404')) {
          const isValid = await verifyUrl(loc);
          if (isValid) return loc;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

async function getQQMusicAudioUrl(songName, artist) {
  try {
    const searchUrl = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=64405487069162918&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w=${encodeURIComponent(songName + ' ' + artist)}&g_tk=5381&jsonpCallback=MusicJsonCallback22315007933490223&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`;
    const responseData = await fetchUrl(searchUrl, {
      'Referer': 'https://y.qq.com/',
      'Origin': 'https://y.qq.com'
    });
    
    if (responseData.status === 200) {
      try {
        const body = responseData.body;
        const match = body.match(/MusicJsonCallback\d+\((.+)\)/);
        if (match) {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.data && jsonData.data.song && jsonData.data.song.list && jsonData.data.song.list.length > 0) {
            const song = jsonData.data.song.list[0];
            const mediaMid = song.mid;
            const guid = Math.floor(Math.random() * 1000000000);
            
            const urlUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data={"req":{"module":"CDN.SrfCdnDispatchServer","method":"GetCdnDispatch","param":{"guid":"${guid}","calltype":0,"userip":""}},"req_0":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"${guid}","songmid":["${mediaMid}"],"songtype":[0],"uin":"0","loginflag":1,"platform":"20"}},"comm":{"uin":"0","format":"json","ct":20,"cv":0}}`;
            
            const vkeyResponse = await fetchUrl(urlUrl, {
              'Referer': 'https://y.qq.com/',
              'Origin': 'https://y.qq.com'
            });
            
            if (vkeyResponse.status === 200) {
              const vkeyData = JSON.parse(vkeyResponse.body);
              if (vkeyData.req_0 && vkeyData.req_0.data && vkeyData.req_0.data.midurlinfo && vkeyData.req_0.data.midurlinfo.length > 0) {
                const midUrlInfo = vkeyData.req_0.data.midurlinfo[0];
                const purl = midUrlInfo.purl;
                if (purl) {
                  const audioUrl = `https://isure.stream.qqmusic.qq.com/${purl}`;
                  const isValid = await verifyUrl(audioUrl);
                  if (isValid) return audioUrl;
                }
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }
  
  return null;
}

async function getThirdPartyAudioUrl(songId) {
  const apiUrls = [
    `https://netease-cloud-music-api-eta-five.vercel.app/song/url?id=${songId}`,
    `https://api.injahow.cn/meting/api?server=netease&type=song&id=${songId}`,
    `https://api.bzqll.com/music/netease/song?id=${songId}&type=json`,
    `https://music.666ccc.com/api/netease/song?id=${songId}`,
    `https://api.mixmoe.cn/netease/song?id=${songId}`,
    `https://api.paugram.com/music/netease?id=${songId}`,
    `https://api.zhaoge.club/api/netease/song?id=${songId}`,
    `https://api.dogecloud.cn/api/netease/song?id=${songId}`,
    `https://api.y.qq.com/v1/music/fcgi-bin/music_mini_player?songid=${songId}`,
    `https://api.kugou.com/yy/index.php?r=play/getdata&hash=${songId}&mid=1`,
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
          } else if (jsonData.music && jsonData.music.url) {
            audioUrl = jsonData.music.url;
          } else if (jsonData.data && jsonData.data.list && Array.isArray(jsonData.data.list) && jsonData.data.list.length > 0) {
            const song = jsonData.data.list[0];
            if (song.mp3Url || song.playUrl || song.url) {
              audioUrl = song.mp3Url || song.playUrl || song.url;
            }
          } else if (jsonData.data && jsonData.data.play_url) {
            audioUrl = jsonData.data.play_url;
          }
          
          if (audioUrl && audioUrl.startsWith('http') && !audioUrl.includes('404') && !audioUrl.includes('music.163.com/404')) {
            const isValid = await verifyUrl(audioUrl);
            if (isValid) return audioUrl;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

async function getAudioUrl(songId, songName = '', artist = '') {
  let audioUrl = await getNeteaseAudioUrl(songId);
  if (audioUrl) return audioUrl;
  
  audioUrl = await getThirdPartyAudioUrl(songId);
  if (audioUrl) return audioUrl;
  
  if (songName && artist) {
    audioUrl = await getQQMusicAudioUrl(songName, artist);
    if (audioUrl) return audioUrl;
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
  
  const { keywords, id, stream, platform, name, artist } = req.query;
  
  if (keywords) {
    const targetUrl = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(keywords)}&type=1&offset=0&limit=10`;
    try {
      const responseData = await fetchUrl(targetUrl);
      if (responseData.status === 200) {
        try {
          let jsonData;
          const body = responseData.body;
          
          if (body.length > 100 && !body.startsWith('{')) {
            jsonData = decryptNeteaseData(body);
          } else {
            jsonData = JSON.parse(body);
          }
          
          if (jsonData) {
            res.status(200).json({ success: true, data: jsonData });
          } else {
            res.status(500).json({ 
              success: false, 
              message: '解析响应失败',
              rawBodyLength: body.length
            });
          }
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
  
  if (id && stream) {
    const audioUrl = await getAudioUrl(id, name, artist);
    
    if (!audioUrl) {
      res.status(200).json({ success: false, message: '无法获取播放链接，可能是版权限制', data: null });
      return;
    }
    
    try {
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
        res.status(500).json({ success: false, message: '音频流代理失败', error: e.message });
      });
      
      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.status(504).json({ success: false, message: '音频流请求超时' });
      });
      
      proxyReq.end();
      
      return;
    } catch (error) {
      res.status(500).json({ success: false, message: '音频流代理失败', error: error.message });
      return;
    }
  }
  
  if (id) {
    const audioUrl = await getAudioUrl(id, name, artist);
    
    if (audioUrl) {
      res.status(200).json({ success: true, data: { url: audioUrl } });
    } else {
      res.status(200).json({ success: false, message: '无法获取播放链接，可能是版权限制', data: null });
    }
    return;
  }
  
  res.status(400).json({ success: false, message: '缺少参数' });
};
